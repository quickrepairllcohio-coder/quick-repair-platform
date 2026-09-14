-- v4.1 production mobile sync + push delivery reliability
alter table public.offline_sync_queue
  add column if not exists client_operation_id uuid;
create unique index if not exists offline_sync_client_operation_uidx
  on public.offline_sync_queue(technician_id, client_operation_id)
  where client_operation_id is not null;
create or replace function public.enqueue_offline_operation(
  p_device_id text,
  p_operation text,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb,
  p_client_created_at timestamptz,
  p_client_operation_id uuid default null
) returns public.offline_sync_queue
language plpgsql security definer set search_path=public as $$
declare
  q public.offline_sync_queue;
  t uuid;
begin
  select id into t from public.technicians where user_id=auth.uid();
  if t is null then raise exception 'Technician not found'; end if;
  if coalesce(trim(p_operation),'')='' or coalesce(trim(p_entity_type),'')='' then
    raise exception 'Operation and entity type are required';
  end if;
  insert into public.offline_sync_queue(
    technician_id,device_id,operation,entity_type,entity_id,payload,client_created_at,client_operation_id
  ) values(
    t,p_device_id,p_operation,p_entity_type,p_entity_id,coalesce(p_payload,'{}'),coalesce(p_client_created_at,now()),p_client_operation_id
  )
  on conflict (technician_id,client_operation_id) where client_operation_id is not null
  do update set last_error=null
  returning * into q;
  return q;
end $$;
revoke all on function public.enqueue_offline_operation(text,text,text,uuid,jsonb,timestamptz) from public;
grant execute on function public.enqueue_offline_operation(text,text,text,uuid,jsonb,timestamptz,uuid) to authenticated;
create or replace function public.apply_offline_operation(p_queue_id uuid)
returns public.offline_sync_queue
language plpgsql security definer set search_path=public as $$
declare
  q public.offline_sync_queue;
  t uuid;
  v_job public.jobs;
  v_check public.job_checklist_items;
  v_completed boolean;
begin
  select id into t from public.technicians where user_id=auth.uid();
  if t is null then raise exception 'Technician not found'; end if;
  select * into q from public.offline_sync_queue where id=p_queue_id and technician_id=t for update;
  if q.id is null then raise exception 'Queue item not found or unauthorized'; end if;
  if q.status='synced' then return q; end if;
  if q.entity_type='job_checklist_item' and q.operation='toggle' then
    select * into v_check from public.job_checklist_items where id=q.entity_id;
    if v_check.id is null then raise exception 'Checklist item not found'; end if;
    if not exists(select 1 from public.jobs where id=v_check.job_id and assigned_technician_id=t) then raise exception 'Job not assigned to technician'; end if;
    v_completed := coalesce((q.payload->>'completed')::boolean, false);
    update public.job_checklist_items
      set completed=v_completed,
          completed_at=case when v_completed then coalesce((q.payload->>'completed_at')::timestamptz,now()) else null end,
          completed_by=case when v_completed then (select user_id from public.technicians where id=t) else null end
      where id=v_check.id;
  elsif q.entity_type='job' and q.operation='status' then
    if q.entity_id is null then raise exception 'Job id is required'; end if;
    select * into v_job from public.jobs where id=q.entity_id and assigned_technician_id=t for update;
    if v_job.id is null then raise exception 'Job not found or not assigned to technician'; end if;
    if (q.payload->>'status') not in ('scheduled','en_route','in_progress','completed') then
      raise exception 'Unsupported technician job status';
    end if;
    update public.jobs set status=q.payload->>'status', updated_at=now(),
      check_in_at=case when q.payload->>'status'='in_progress' then coalesce(check_in_at,now()) else check_in_at end
      where id=v_job.id;
    insert into public.job_status_history(job_id,status,changed_by,reason)
      values(v_job.id,q.payload->>'status',(select user_id from public.technicians where id=t),'Offline mobile sync');
  else
    raise exception 'Unsupported offline operation';
  end if;
  update public.offline_sync_queue set status='synced',synced_at=now(),last_error=null where id=q.id returning * into q;
  return q;
exception when others then
  update public.offline_sync_queue set status='failed',last_error=left(sqlerrm,1000) where id=q.id;
  raise;
end $$;
revoke all on function public.apply_offline_operation(uuid) from public;
grant execute on function public.apply_offline_operation(uuid) to authenticated;
-- Ensure staff can inspect failed sync records without exposing them to customers.
create policy offline_sync_staff_read on public.offline_sync_queue for select to authenticated
using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin'));
-- Safer push queue processing: only one worker may claim a row at a time.
create or replace function public.claim_push_notifications(p_limit integer default 50)
returns setof public.push_notification_queue
language plpgsql security definer set search_path=public as $$
begin
  return query
  with claimed as (
    select id from public.push_notification_queue
    where status='pending' and available_at<=now()
    order by created_at
    for update skip locked
    limit greatest(1,least(p_limit,200))
  )
  update public.push_notification_queue q
    set status='processing', attempts=q.attempts+1
  from claimed c
  where q.id=c.id
  returning q.*;
end $$;
revoke all on function public.claim_push_notifications(integer) from public;
grant execute on function public.claim_push_notifications(integer) to service_role;
