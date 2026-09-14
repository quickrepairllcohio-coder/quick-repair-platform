-- v4.0 mobile media + push event hardening
insert into storage.buckets (id, name, public)
values ('quick-repair-media', 'quick-repair-media', false)
on conflict (id) do update set public=false;
alter table public.request_media enable row level security;
create policy request_media_customer_manage on public.request_media for all to authenticated
using (request_id in (select id from public.service_requests where customer_id in (select id from public.customers where user_id=auth.uid())))
with check (request_id in (select id from public.service_requests where customer_id in (select id from public.customers where user_id=auth.uid())));
create policy request_media_staff_read on public.request_media for select to authenticated
using (public.current_user_role() in ('admin','dispatcher','super_admin'));
create policy storage_media_customer on storage.objects for all to authenticated
using (bucket_id='quick-repair-media' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='quick-repair-media' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_media_staff on storage.objects for select to authenticated
using (bucket_id='quick-repair-media' and public.current_user_role() in ('admin','dispatcher','super_admin'));
create table if not exists public.push_notification_queue (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  title text not null, body text not null, data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0, available_at timestamptz not null default now(), processed_at timestamptz, last_error text,
  created_at timestamptz not null default now()
);
create index if not exists push_queue_pending_idx on public.push_notification_queue(status, available_at);
alter table public.push_notification_queue enable row level security;
create or replace function public.enqueue_push_notification(p_user_id uuid,p_title text,p_body text,p_data jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.current_user_role() not in ('admin','dispatcher','super_admin') then raise exception 'Forbidden'; end if;
  insert into public.push_notification_queue(user_id,title,body,data) values(p_user_id,p_title,p_body,coalesce(p_data,'{}'::jsonb)) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.enqueue_push_notification(uuid,text,text,jsonb) from public;
grant execute on function public.enqueue_push_notification(uuid,text,text,jsonb) to authenticated;
create or replace function public.queue_job_push_event() returns trigger language plpgsql security definer set search_path=public as $$
declare v_user uuid; v_customer_user uuid; v_title text; v_body text;
begin
  if new.assigned_technician_id is not null and (tg_op='INSERT' or old.assigned_technician_id is distinct from new.assigned_technician_id) then
    select t.user_id into v_user from public.technicians t where t.id=new.assigned_technician_id;
    if v_user is not null then insert into public.push_notification_queue(user_id,title,body,data) values(v_user,'New Quick Repair job','A new job has been assigned to you.',jsonb_build_object('job_id',new.id,'type','job_assigned')); end if;
  end if;
  if tg_op='UPDATE' and old.status is distinct from new.status then
    select c.user_id into v_customer_user from public.customers c where c.id=new.customer_id;
    if v_customer_user is not null then
      v_title := case when new.status='completed' then 'Job completed' when new.status='in_progress' then 'Technician started the job' else 'Job status updated' end;
      v_body := case when new.status='completed' then 'Your Quick Repair job has been completed.' when new.status='in_progress' then 'Your technician has started the job.' else 'Your Quick Repair job status changed to '||new.status||'.' end;
      insert into public.push_notification_queue(user_id,title,body,data) values(v_customer_user,v_title,v_body,jsonb_build_object('job_id',new.id,'type','job_status','status',new.status));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_queue_job_push_event on public.jobs;
create trigger trg_queue_job_push_event after insert or update of assigned_technician_id,status on public.jobs for each row execute function public.queue_job_push_event();
revoke all on function public.queue_job_push_event() from public;
