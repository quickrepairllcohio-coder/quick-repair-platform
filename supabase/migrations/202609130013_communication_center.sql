create type public.message_sender_type as enum ('customer','technician','dispatcher','system');
create type public.message_status as enum ('sent','delivered','read','failed');
create table if not exists public.job_messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  sender_user_id uuid not null references public.users(id) on delete cascade,
  sender_type public.message_sender_type not null,
  body text,
  media_url text,
  media_type text,
  status public.message_status not null default 'sent',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint job_messages_content_check check (coalesce(length(trim(body)),0) > 0 or media_url is not null)
);
create index if not exists job_messages_job_created_idx on public.job_messages(job_id, created_at asc);
create index if not exists job_messages_sender_idx on public.job_messages(sender_user_id, created_at desc);
alter table public.job_messages enable row level security;
create or replace function public.can_access_job_chat(p_job_id uuid)
returns boolean language sql security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.jobs j
    join public.customers c on c.id = j.customer_id
    where j.id = p_job_id
      and c.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.jobs j
    join public.technicians t on t.id = j.assigned_technician_id
    where j.id = p_job_id
      and t.user_id = auth.uid()
  )
  or exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('dispatcher','supervisor','estimator','finance','admin','super_admin')
      and u.status = 'active'
  );
$$;
revoke all on function public.can_access_job_chat(uuid) from public;
grant execute on function public.can_access_job_chat(uuid) to authenticated;
drop policy if exists job_messages_select on public.job_messages;
create policy job_messages_select on public.job_messages
for select to authenticated
using (public.can_access_job_chat(job_id));
drop policy if exists job_messages_insert on public.job_messages;
create policy job_messages_insert on public.job_messages
for insert to authenticated
with check (sender_user_id = auth.uid() and public.can_access_job_chat(job_id));
create or replace function public.send_job_message(
  p_job_id uuid,
  p_body text default null,
  p_media_url text default null,
  p_media_type text default null
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_type public.message_sender_type;
  v_role public.user_role;
begin
  if not public.can_access_job_chat(p_job_id) then
    raise exception 'not authorized';
  end if;
  select role into v_role from public.users where id = auth.uid();
  v_type := case
    when v_role = 'customer' then 'customer'::public.message_sender_type
    when v_role = 'technician' then 'technician'::public.message_sender_type
    when v_role in ('dispatcher','supervisor','estimator','finance','admin','super_admin') then 'dispatcher'::public.message_sender_type
    else 'system'::public.message_sender_type
  end;
  if coalesce(length(trim(p_body)),0) = 0 and p_media_url is null then
    raise exception 'message cannot be empty';
  end if;
  insert into public.job_messages(job_id,sender_user_id,sender_type,body,media_url,media_type)
  values(p_job_id,auth.uid(),v_type,nullif(trim(p_body),''),p_media_url,p_media_type)
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.send_job_message(uuid,text,text,text) from public;
grant execute on function public.send_job_message(uuid,text,text,text) to authenticated;
create or replace function public.mark_job_message_read(p_message_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare v_job_id uuid;
begin
  select job_id into v_job_id from public.job_messages where id = p_message_id;
  if v_job_id is null or not public.can_access_job_chat(v_job_id) then
    raise exception 'not authorized';
  end if;
  update public.job_messages
  set status='read', read_at=coalesce(read_at,now())
  where id=p_message_id;
end; $$;
revoke all on function public.mark_job_message_read(uuid) from public;
grant execute on function public.mark_job_message_read(uuid) to authenticated;
-- Realtime: one private topic per job chat.
drop policy if exists job_chat_realtime_receive on realtime.messages;
create policy job_chat_realtime_receive on realtime.messages
for select to authenticated
using (
  split_part(realtime.topic(), ':', 2) <> ''
  and split_part(realtime.topic(), ':', 3) = 'chat'
  and public.can_access_job_chat(split_part(realtime.topic(), ':', 2)::uuid)
);
create or replace function public.broadcast_job_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform realtime.broadcast_changes(
    'job:' || new.job_id::text || ':chat',
    'message_created',
    'INSERT',
    new,
    null
  );
  return new;
end; $$;
drop trigger if exists job_messages_broadcast on public.job_messages;
create trigger job_messages_broadcast
after insert on public.job_messages
for each row execute function public.broadcast_job_message();
-- SMS/email delivery is intentionally queued through notifications; provider secrets remain server-side.
create or replace function public.queue_job_message_notification(p_job_id uuid, p_message_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_customer_user uuid;
  v_body text;
begin
  select c.user_id into v_customer_user
  from public.jobs j join public.customers c on c.id=j.customer_id
  where j.id=p_job_id;
  select body into v_body from public.job_messages where id=p_message_id;
  if v_customer_user is not null then
    insert into public.notifications(user_id,customer_id,job_id,type,title,body,channel,status,data)
    select v_customer_user,c.id,p_job_id,'job_message','New message',coalesce(v_body,'New message'),'in_app','queued',jsonb_build_object('message_id',p_message_id)
    from public.customers c where c.user_id=v_customer_user;
  end if;
end; $$;
revoke all on function public.queue_job_message_notification(uuid,uuid) from public;
grant execute on function public.queue_job_message_notification(uuid,uuid) to authenticated;
create or replace function public.queue_customer_message_notification_trigger()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.sender_type <> 'customer' then
    perform public.queue_job_message_notification(new.job_id,new.id);
  end if;
  return new;
end; $$;
drop trigger if exists job_messages_customer_notification on public.job_messages;
create trigger job_messages_customer_notification
after insert on public.job_messages
for each row execute function public.queue_customer_message_notification_trigger();
