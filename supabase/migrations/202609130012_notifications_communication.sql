create type notification_channel as enum ('in_app','push','sms','email');
create type notification_status as enum ('queued','sent','failed','read');
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  request_id uuid references public.service_requests(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  channel notification_channel not null default 'in_app',
  status notification_status not null default 'queued',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_job_idx on public.notifications(job_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  update public.notifications
  set status='read', read_at=coalesce(read_at, now())
  where id=p_notification_id and user_id=auth.uid();
end; $$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;
create or replace function public.create_in_app_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_job_id uuid default null,
  p_request_id uuid default null,
  p_data jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not exists (
    select 1 from public.users u
    where u.id=auth.uid() and u.role in ('dispatcher','supervisor','admin','super_admin')
  ) then raise exception 'not authorized'; end if;
  insert into public.notifications(user_id,type,title,body,channel,status,job_id,request_id,data,sent_at)
  values(p_user_id,p_type,p_title,p_body,'in_app','sent',p_job_id,p_request_id,p_data,now())
  returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.create_in_app_notification(uuid,text,text,text,uuid,uuid,jsonb) from public;
grant execute on function public.create_in_app_notification(uuid,text,text,text,uuid,uuid,jsonb) to authenticated;
-- Realtime private channel authorization for user notification feeds.
drop policy if exists notifications_realtime_receive on realtime.messages;
create policy notifications_realtime_receive on realtime.messages
for select to authenticated
using (
  realtime.topic() = 'user:' || auth.uid()::text || ':notifications'
);
