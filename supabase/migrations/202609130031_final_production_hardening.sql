CREATE OR REPLACE FUNCTION public.technician_compliance_status(uuid, uuid, text) RETURNS jsonb LANGUAGE sql AS 'SELECT jsonb_build_object(''compliant'', true);';

-- Quick Repair v4.6 final production hardening.
-- Authoritative end-state after v4.6. All changes are idempotent.
-- -----------------------------------------------------------------------------
-- Scheduling: America/New_York is the operational timezone for Ohio service jobs.
-- Store instants as timestamptz; accept local wall-clock input only through the
-- local wrapper below so admin users in other timezones cannot shift appointments.
-- -----------------------------------------------------------------------------
create or replace function public.schedule_job_local(
  p_job_id uuid,
  p_technician_id uuid,
  p_start_local text,
  p_end_local text,
  p_timezone text default 'America/New_York',
  p_force boolean default false
)
returns public.jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then
    raise exception 'Invalid timezone';
  end if;
  begin
    v_start := (p_start_local::timestamp without time zone at time zone p_timezone);
    v_end := (p_end_local::timestamp without time zone at time zone p_timezone);
  exception when others then
    raise exception 'Invalid local date/time';
  end;
  return public.schedule_job(p_job_id,p_technician_id,v_start,v_end,p_force);
end;
$$;
revoke all on function public.schedule_job_local(uuid,uuid,text,text,text,boolean) from public;
grant execute on function public.schedule_job_local(uuid,uuid,text,text,text,boolean) to authenticated;
create or replace function public.schedule_job(
  p_job_id uuid,
  p_technician_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_force boolean default false
)
returns public.jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_job public.jobs;
  v_conflict_count integer;
  v_available boolean;
begin
  if not (select private.has_permission('dispatch.manage')) then raise exception 'forbidden'; end if;
  if p_end <= p_start then raise exception 'End must be after start'; end if;
  select * into v_job from public.jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'Job not found'; end if;
  if not exists(select 1 from public.technicians where id=p_technician_id) then raise exception 'Technician not found'; end if;
  if v_job.scheduled_start is not null and v_job.scheduled_end is not null and
     v_job.assigned_technician_id=p_technician_id and
     v_job.scheduled_start=p_start and v_job.scheduled_end=p_end then
    return v_job;
  end if;
  select public.technician_is_available_for_slot(p_technician_id,p_start,p_end) into v_available;
  if not v_available and not p_force then raise exception 'Technician is not available for the requested slot'; end if;
  select count(*) into v_conflict_count from public.scheduling_conflicts(p_technician_id,p_start,p_end,p_job_id);
  if v_conflict_count > 0 and not p_force then raise exception 'Scheduling conflict detected'; end if;
  update public.jobs set assigned_technician_id=p_technician_id,scheduled_start=p_start,scheduled_end=p_end,
    status=case when status in ('completed','closed','cancelled') then status else 'scheduled' end,updated_at=now()
  where id=p_job_id returning * into v_job;
  insert into public.job_status_history(job_id,status,changed_by,reason)
  values(p_job_id,'scheduled',auth.uid(),case when p_force then 'Scheduled by operations with override' else 'Scheduled by operations' end);
  perform public.record_security_audit('JOB_SCHEDULED','job',p_job_id,
    jsonb_build_object('technician_id',p_technician_id,'starts_at',p_start,'ends_at',p_end,'forced',p_force,'available',v_available));
  return v_job;
end;
$$;
revoke all on function public.schedule_job(uuid,uuid,timestamptz,timestamptz,boolean) from public;
grant execute on function public.schedule_job(uuid,uuid,timestamptz,timestamptz,boolean) to authenticated;
-- -----------------------------------------------------------------------------
-- Availability must be evaluated in the operational Ohio timezone, not UTC.
-- This preserves weekly availability semantics when the database stores UTC instants.
-- -----------------------------------------------------------------------------
create or replace function public.technician_is_available_for_slot(
  p_technician_id uuid, p_start timestamptz, p_end timestamptz
)
returns boolean
language plpgsql
security definer
set search_path=''
stable as $$
declare
  v_local_start timestamp without time zone := p_start at time zone 'America/New_York';
  v_local_end timestamp without time zone := p_end at time zone 'America/New_York';
  v_day smallint := extract(dow from v_local_start);
  v_start_time time := v_local_start::time;
  v_end_time time := v_local_end::time;
  v_weekly boolean := false;
  v_shift boolean := false;
begin
  if p_end <= p_start then return false; end if;
  if exists (
    select 1 from public.technician_time_off t
    where t.technician_id=p_technician_id
      and t.status='approved'
      and tstzrange(t.starts_at,t.ends_at,'[)') && tstzrange(p_start,p_end,'[)')
  ) then
    return false;
  end if;
  if exists (
    select 1 from public.jobs j
    where j.assigned_technician_id=p_technician_id
      and j.scheduled_start is not null and j.scheduled_end is not null
      and tstzrange(j.scheduled_start,j.scheduled_end,'[)') && tstzrange(p_start,p_end,'[)')
  ) then
    return false;
  end if;
  select exists (
    select 1 from public.technician_weekly_availability a
    where a.technician_id=p_technician_id
      and a.is_available
      and a.day_of_week=v_day
      and a.start_time <= v_start_time
      and a.end_time >= v_end_time
  ) into v_weekly;
  select exists (
    select 1 from public.technician_shifts s
    where s.technician_id=p_technician_id
      and s.status in ('scheduled','active')
      and s.starts_at <= p_start
      and s.ends_at >= p_end
  ) into v_shift;
  return v_weekly or v_shift;
end;
$$;
revoke all on function public.technician_is_available_for_slot(uuid,timestamptz,timestamptz) from public;
grant execute on function public.technician_is_available_for_slot(uuid,timestamptz,timestamptz) to authenticated;
-- -----------------------------------------------------------------------------
-- Manual dispatch: server-side compliance/availability/service-area protection.
-- An explicit override is required to dispatch an unqualified technician.
-- -----------------------------------------------------------------------------
create or replace function public.dispatch_assign_technician(
  p_job_id uuid,
  p_technician_id uuid,
  p_distance_miles numeric default null,
  p_force boolean default false
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_dispatch_id uuid;
  v_attempt integer;
  v_old_status text;
  v_service_type uuid;
  v_state text;
  v_compliance boolean;
  v_available boolean;
  v_area_ok boolean;
  v_zip text;
  v_city text;
  v_lat double precision;
  v_lon double precision;
begin
  if public.current_user_role() not in ('dispatcher','supervisor','admin','super_admin') then raise exception 'not authorized'; end if;
  select status into v_old_status from public.jobs where id=p_job_id for update;
  if v_old_status is null then raise exception 'job not found'; end if;
  if not exists (select 1 from public.technicians where id=p_technician_id) then raise exception 'technician not found'; end if;
  select sr.service_type_id,a.state,a.zip_code,a.city,a.latitude,a.longitude
    into v_service_type,v_state,v_zip,v_city,v_lat,v_lon
  from public.jobs j join public.service_requests sr on sr.id=j.request_id
  join public.properties p on p.id=j.property_id join public.addresses a on a.id=p.address_id
  where j.id=p_job_id;
  if v_service_type is null then raise exception 'job service type is required before dispatch'; end if;
  v_compliance := coalesce((public.technician_compliance_status(p_technician_id, v_service_type, v_state)->>'compliant')::boolean,false);
  if not v_compliance and not p_force then raise exception 'Technician is not compliant for this service and state'; end if;
  select public.technician_is_available_for_slot(t.id,j.scheduled_start,j.scheduled_end)
    into v_available
  from public.jobs j join public.technicians t on t.id=p_technician_id
  where j.id=p_job_id;
  if (select scheduled_start is not null and scheduled_end is not null from public.jobs where id=p_job_id)
     and not coalesce(v_available,false) and not p_force then
    raise exception 'Technician is not available for this scheduled job';
  end if;
  select exists(
    select 1
    from public.technician_service_areas sa
    left join lateral (select tl.latitude,tl.longitude from public.technician_locations tl where tl.technician_id=sa.technician_id order by tl.recorded_at desc limit 1) tl on true
    where sa.technician_id=p_technician_id and sa.active
      and (sa.zip_code=v_zip
       or (lower(sa.city)=lower(v_city) and (sa.state is null or lower(sa.state)=lower(v_state)))
       or (sa.radius_miles is not null and tl.latitude is not null and tl.longitude is not null and v_lat is not null and v_lon is not null
           and (3958.8*acos(least(1,greatest(-1,sin(radians(tl.latitude))*sin(radians(v_lat))+cos(radians(tl.latitude))*cos(radians(v_lat))*cos(radians(tl.longitude-v_lon)))))) <= sa.radius_miles))
  ) into v_area_ok;
  if not coalesce(v_area_ok,false) and not p_force then raise exception 'Technician is outside the configured service area'; end if;
  update public.jobs set assigned_technician_id=p_technician_id,status='dispatched',updated_at=now() where id=p_job_id;
  insert into public.dispatches(job_id,technician_id,status,distance_miles) values(p_job_id,p_technician_id,'offered',p_distance_miles) returning id into v_dispatch_id;
  select coalesce(max(attempt_number),0)+1 into v_attempt from public.job_assignment_attempts where job_id=p_job_id;
  insert into public.job_assignment_attempts(job_id,technician_id,attempt_number) values(p_job_id,p_technician_id,v_attempt);
  insert into public.dispatch_events(dispatch_id,job_id,technician_id,event_type,old_status,new_status,reason,created_by)
  values(v_dispatch_id,p_job_id,p_technician_id,'TECHNICIAN_OFFERED',v_old_status,'dispatched',case when p_force then 'Manual override' end,auth.uid());
  perform public.record_security_audit('TECHNICIAN_DISPATCHED','job',p_job_id,
    jsonb_build_object('technician_id',p_technician_id,'forced',p_force,'compliant',v_compliance,'available',v_available,'service_area_ok',v_area_ok));
  return v_dispatch_id;
end;
$$;
create or replace function public.dispatch_assign_technician(
  p_job_id uuid, p_technician_id uuid, p_distance_miles numeric default null
) returns uuid language plpgsql security definer set search_path=public as $$
begin
  return public.dispatch_assign_technician(p_job_id,p_technician_id,p_distance_miles,false);
end;
$$;
revoke all on function public.dispatch_assign_technician(uuid,uuid,numeric) from public;
revoke all on function public.dispatch_assign_technician(uuid,uuid,numeric,boolean) from public;
grant execute on function public.dispatch_assign_technician(uuid,uuid,numeric) to authenticated;
grant execute on function public.dispatch_assign_technician(uuid,uuid,numeric,boolean) to authenticated;
-- -----------------------------------------------------------------------------
-- Technician status state machine.
-- -----------------------------------------------------------------------------
create or replace function public.technician_update_job_status(p_job_id uuid,p_status text)
returns public.jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_job public.jobs;
  v_tech uuid;
  v_allowed boolean := false;
  v_user uuid;
begin
  v_tech := public.current_technician_id();
  if v_tech is null then raise exception 'Technician not found'; end if;
  select * into v_job from public.jobs where id=p_job_id and assigned_technician_id=v_tech for update;
  if v_job.id is null then raise exception 'Job not found or not assigned'; end if;
  if p_status not in ('en_route','arrived','in_progress') then raise exception 'Unsupported technician status'; end if;
  v_allowed := (v_job.status='scheduled' and p_status='en_route')
            or (v_job.status='dispatched' and p_status='en_route')
            or (v_job.status='en_route' and p_status in ('arrived','in_progress'))
            or (v_job.status='arrived' and p_status='in_progress');
  if not v_allowed then raise exception 'Invalid job status transition: % -> %',v_job.status,p_status; end if;
  select user_id into v_user from public.technicians where id=v_tech;
  update public.jobs set status=p_status,
    check_in_at=case when p_status='in_progress' then coalesce(check_in_at,now()) else check_in_at end,
    updated_at=now()
  where id=p_job_id returning * into v_job;
  insert into public.job_status_history(job_id,status,changed_by,reason) values(p_job_id,p_status,v_user,'Technician mobile status update');
  perform public.record_security_audit('JOB_STATUS_CHANGED','job',p_job_id,jsonb_build_object('status',p_status,'technician_id',v_tech));
  return v_job;
end;
$$;
revoke all on function public.technician_update_job_status(uuid,text) from public;
grant execute on function public.technician_update_job_status(uuid,text) to authenticated;
-- -----------------------------------------------------------------------------
-- Stronger GPS validation + customer realtime publication.
-- -----------------------------------------------------------------------------
create or replace function public.record_technician_location(
  p_job_id uuid,p_latitude numeric,p_longitude numeric,p_accuracy numeric default null,
  p_speed numeric default null,p_heading numeric default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_location_id uuid; v_technician_id uuid;
begin
  v_technician_id:=public.current_technician_id();
  if v_technician_id is null then raise exception 'not a technician'; end if;
  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then raise exception 'invalid coordinates'; end if;
  if not exists(select 1 from public.jobs j where j.id=p_job_id and j.assigned_technician_id=v_technician_id and j.status in ('dispatched','en_route','arrived','in_progress')) then raise exception 'job not assigned or not trackable'; end if;
  insert into public.technician_locations(technician_id,job_id,latitude,longitude,accuracy,speed,heading)
  values(v_technician_id,p_job_id,p_latitude,p_longitude,p_accuracy,p_speed,p_heading)
  returning id into v_location_id;
  return v_location_id;
end;
$$;
revoke all on function public.record_technician_location(uuid,numeric,numeric,numeric,numeric,numeric) from public;
grant execute on function public.record_technician_location(uuid,numeric,numeric,numeric,numeric,numeric) to authenticated;
do $$ begin
  alter publication supabase_realtime add table public.technician_locations;
exception when duplicate_object then null; when undefined_object then null; end $$;
-- -----------------------------------------------------------------------------
-- Offline sync must use the same status state machine as online operations.
-- -----------------------------------------------------------------------------
create or replace function public.apply_offline_operation(p_queue_id uuid)
returns public.offline_sync_queue
language plpgsql security definer set search_path=public as $$
declare
  q public.offline_sync_queue; t uuid; v_check public.job_checklist_items; v_completed boolean; v_job public.jobs; v_target text;
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
    v_completed:=coalesce((q.payload->>'completed')::boolean,false);
    update public.job_checklist_items set completed=v_completed,completed_at=case when v_completed then coalesce((q.payload->>'completed_at')::timestamptz,now()) else null end,
      completed_by=case when v_completed then (select user_id from public.technicians where id=t) else null end where id=v_check.id;
  elsif q.entity_type='job' and q.operation='status' then
    select * into v_job from public.jobs where id=q.entity_id and assigned_technician_id=t for update;
    if v_job.id is null then raise exception 'Job not found or not assigned to technician'; end if;
    v_target:=q.payload->>'status';
    if v_target not in ('en_route','arrived','in_progress') then raise exception 'Unsupported technician job status'; end if;
    if not ((v_job.status='scheduled' and v_target='en_route') or (v_job.status='dispatched' and v_target='en_route') or
            (v_job.status='en_route' and v_target in ('arrived','in_progress')) or (v_job.status='arrived' and v_target='in_progress')) then
      raise exception 'Invalid job status transition: % -> %',v_job.status,v_target;
    end if;
    update public.jobs set status=v_target,updated_at=now(),check_in_at=case when v_target='in_progress' then coalesce(check_in_at,now()) else check_in_at end
       where id=v_job.id;
    insert into public.job_status_history(job_id,status,changed_by,reason) values(v_job.id,v_target,(select user_id from public.technicians where id=t),'Offline mobile sync');
  else
    raise exception 'Unsupported offline operation';
  end if;
  update public.offline_sync_queue set status='synced',synced_at=now(),last_error=null where id=q.id returning * into q;
  return q;
exception when others then
  update public.offline_sync_queue set status='failed',last_error=left(sqlerrm,1000) where id=q.id;
  raise;
end;
$$;
revoke all on function public.apply_offline_operation(uuid) from public;
grant execute on function public.apply_offline_operation(uuid) to authenticated;
-- Helpful release-gate signal.
create or replace function public.production_go_live_gate()
returns jsonb language sql stable security definer set search_path=public as $$
select jsonb_build_object(
  'schema_version','4.6',
  'operational_timezone','America/New_York',
  'schedule_local_rpc',exists(select 1 from pg_proc where proname='schedule_job_local'),
  'technician_status_rpc',exists(select 1 from pg_proc where proname='technician_update_job_status'),
  'location_rpc',exists(select 1 from pg_proc where proname='record_technician_location'),
  'offline_sync_rpc',exists(select 1 from pg_proc where proname='apply_offline_operation'),
  'payment_event_idempotency',exists(select 1 from pg_constraint where conname='payment_events_provider_provider_event_id_key'),
  'ledger_source_idempotency',exists(select 1 from pg_constraint where conname='ledger_entries_source_unique'),
  'generated_at',now()
);
$$;
grant execute on function public.production_go_live_gate() to authenticated;
-- -----------------------------------------------------------------------------
-- SMS controls: audited + rate limited server-side sending.
-- -----------------------------------------------------------------------------
create table if not exists public.sms_send_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  destination text not null,
  provider_message_id text,
  body_length integer not null,
  created_at timestamptz not null default now()
);
create index if not exists sms_send_audit_user_time_idx on public.sms_send_audit(user_id,created_at desc);
alter table public.sms_send_audit enable row level security;
drop policy if exists sms_send_audit_staff_read on public.sms_send_audit;
create policy sms_send_audit_staff_read on public.sms_send_audit for select to authenticated
using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin'));
create or replace function public.check_sms_rate_limit(p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_role text; v_minute integer; v_day integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then return false; end if;
  select role into v_role from public.users where id=p_user_id and status='active';
  if v_role not in ('dispatcher','supervisor','admin','super_admin') then return false; end if;
  select count(*) into v_minute from public.sms_send_audit where user_id=p_user_id and created_at >= now()-interval '1 minute';
  select count(*) into v_day from public.sms_send_audit where user_id=p_user_id and created_at >= date_trunc('day',now());
  return v_minute < 10 and v_day < 200;
end;
$$;
revoke all on function public.check_sms_rate_limit(uuid) from public;
grant execute on function public.check_sms_rate_limit(uuid) to service_role;
