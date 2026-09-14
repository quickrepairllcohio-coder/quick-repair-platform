-- v2.1 Scheduling & Fleet Operations
create table if not exists public.technician_weekly_availability (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  unique (technician_id, day_of_week, start_time, end_time),
  check (end_time > start_time)
);
create table if not exists public.technician_time_off (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  status text not null default 'approved' check (status in ('pending','approved','cancelled')),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table if not exists public.technician_shifts (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  shift_type text not null default 'regular' check (shift_type in ('regular','on_call','emergency')),
  status text not null default 'scheduled' check (status in ('scheduled','active','completed','cancelled')),
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists tech_availability_lookup on public.technician_weekly_availability(technician_id,day_of_week);
create index if not exists tech_time_off_lookup on public.technician_time_off(technician_id,starts_at,ends_at);
create index if not exists tech_shifts_lookup on public.technician_shifts(technician_id,starts_at,ends_at);
create index if not exists jobs_schedule_lookup on public.jobs(assigned_technician_id,scheduled_start,scheduled_end);
alter table public.technician_weekly_availability enable row level security;
alter table public.technician_time_off enable row level security;
alter table public.technician_shifts enable row level security;
create policy tech_availability_self_read on public.technician_weekly_availability for select to authenticated
using (technician_id = public.current_technician_id() or (select private.has_permission('technicians.view')));
create policy tech_time_off_self_read on public.technician_time_off for select to authenticated
using (technician_id = public.current_technician_id() or (select private.has_permission('technicians.view')));
create policy tech_shifts_self_read on public.technician_shifts for select to authenticated
using (technician_id = public.current_technician_id() or (select private.has_permission('technicians.view')));
create or replace function public.scheduling_conflicts(
  p_technician_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_exclude_job_id uuid default null
)
returns table(conflict_type text, conflict_id uuid, label text, starts_at timestamptz, ends_at timestamptz)
language sql security definer set search_path = '' stable as $$
  select 'job', j.id, j.job_number, j.scheduled_start, j.scheduled_end
  from public.jobs j
  where j.assigned_technician_id=p_technician_id
    and j.scheduled_start is not null and j.scheduled_end is not null
    and j.id is distinct from p_exclude_job_id
    and tstzrange(j.scheduled_start,j.scheduled_end,'[)') && tstzrange(p_start,p_end,'[)')
  union all
  select 'time_off', t.id, coalesce(t.reason,'Time off'), t.starts_at, t.ends_at
  from public.technician_time_off t
  where t.technician_id=p_technician_id and t.status='approved'
    and tstzrange(t.starts_at,t.ends_at,'[)') && tstzrange(p_start,p_end,'[)')
  union all
  select 'shift', s.id, 'Outside scheduled shift', s.starts_at, s.ends_at
  from public.technician_shifts s
  where false;
$$;
revoke all on function public.scheduling_conflicts(uuid,timestamptz,timestamptz,uuid) from public;
grant execute on function public.scheduling_conflicts(uuid,timestamptz,timestamptz,uuid) to authenticated;
create or replace function public.technician_is_available_for_slot(
  p_technician_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns boolean
language plpgsql security definer set search_path = '' stable as $$
declare
  v_day smallint;
  v_start time;
  v_end time;
begin
  if p_end <= p_start then return false; end if;
  if exists (select 1 from public.technician_time_off t where t.technician_id=p_technician_id and t.status='approved' and tstzrange(t.starts_at,t.ends_at,'[)') && tstzrange(p_start,p_end,'[)')) then return false; end if;
  if exists (select 1 from public.jobs j where j.assigned_technician_id=p_technician_id and j.scheduled_start is not null and j.scheduled_end is not null and tstzrange(j.scheduled_start,j.scheduled_end,'[)') && tstzrange(p_start,p_end,'[)')) then return false; end if;
  v_day := extract(dow from p_start at time zone 'UTC');
  v_start := (p_start at time zone 'UTC')::time;
  v_end := (p_end at time zone 'UTC')::time;
  return exists (select 1 from public.technician_weekly_availability a where a.technician_id=p_technician_id and a.is_available and a.day_of_week=v_day and a.start_time <= v_start and a.end_time >= v_end);
end;
$$;
revoke all on function public.technician_is_available_for_slot(uuid,timestamptz,timestamptz) from public;
grant execute on function public.technician_is_available_for_slot(uuid,timestamptz,timestamptz) to authenticated;
create or replace function public.schedule_job(
  p_job_id uuid,
  p_technician_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_force boolean default false
)
returns public.jobs
language plpgsql security definer set search_path = '' as $$
declare v_job public.jobs; v_conflict_count integer;
begin
  if not (select private.has_permission('dispatch.manage')) then raise exception 'forbidden'; end if;
  if p_end <= p_start then raise exception 'End must be after start'; end if;
  select * into v_job from public.jobs where id=p_job_id for update;
  if v_job.id is null then raise exception 'Job not found'; end if;
  if not exists(select 1 from public.technicians where id=p_technician_id) then raise exception 'Technician not found'; end if;
  select count(*) into v_conflict_count from public.scheduling_conflicts(p_technician_id,p_start,p_end,p_job_id);
  if v_conflict_count > 0 and not p_force then raise exception 'Scheduling conflict detected'; end if;
  update public.jobs set assigned_technician_id=p_technician_id,scheduled_start=p_start,scheduled_end=p_end,status=case when status in ('completed','closed','cancelled') then status else 'scheduled' end,updated_at=now() where id=p_job_id returning * into v_job;
  insert into public.job_status_history(job_id,status,changed_by,reason) values(p_job_id,'scheduled',(select auth.uid()),'Scheduled by operations');
  perform public.record_security_audit('JOB_SCHEDULED','job',p_job_id,jsonb_build_object('technician_id',p_technician_id,'starts_at',p_start,'ends_at',p_end,'forced',p_force));
  return v_job;
end;
$$;
revoke all on function public.schedule_job(uuid,uuid,timestamptz,timestamptz,boolean) from public;
grant execute on function public.schedule_job(uuid,uuid,timestamptz,timestamptz,boolean) to authenticated;
create or replace function public.daily_technician_schedule(p_technician_id uuid, p_day date)
returns table(job_id uuid,job_number text,title text,status text,scheduled_start timestamptz,scheduled_end timestamptz,address_line1 text,city text,state text,zip_code text)
language sql security definer set search_path='' stable as $$
  select j.id,j.job_number,sr.title,j.status,j.scheduled_start,j.scheduled_end,a.address_line1,a.city,a.state,a.zip_code
  from public.jobs j
  join public.service_requests sr on sr.id=j.request_id
  join public.properties p on p.id=j.property_id
  join public.addresses a on a.id=p.address_id
  where j.assigned_technician_id=p_technician_id
    and j.scheduled_start >= p_day::timestamptz
    and j.scheduled_start < (p_day+1)::timestamptz
  order by j.scheduled_start;
$$;
revoke all on function public.daily_technician_schedule(uuid,date) from public;
grant execute on function public.daily_technician_schedule(uuid,date) to authenticated;
drop function if exists public.schedule_candidates(uuid, integer);
drop function if exists public.schedule_candidates(uuid);
create or replace function public.schedule_candidates(p_job_id uuid, p_limit integer default 20)
returns table(technician_id uuid,status text,rating numeric,completed_jobs integer,distance_miles numeric,available boolean,score numeric)
language sql security definer set search_path='' stable as $$
  select t.id,t.status,t.rating,t.completed_jobs,
    case when tl.latitude is null or a.latitude is null then null else round((3958.8 * acos(least(1,greatest(-1,sin(radians(tl.latitude))*sin(radians(a.latitude))+cos(radians(tl.latitude))*cos(radians(a.latitude))*cos(radians(tl.longitude-a.longitude))))))::numeric,2) end as distance_miles,
    public.technician_is_available_for_slot(t.id,j.scheduled_start,j.scheduled_end) as available,
    (case when t.status='available' then 40 else 0 end + coalesce(t.rating,0)*10 + least(t.completed_jobs,100)*0.05) as score
  from public.jobs j
  join public.properties p on p.id=j.property_id
  join public.addresses a on a.id=p.address_id
  cross join public.technicians t
  left join lateral (select latitude,longitude from public.technician_locations x where x.technician_id=t.id order by recorded_at desc limit 1) tl on true
  where j.id=p_job_id and t.status in ('available','offline','busy')
  order by available desc, score desc, distance_miles nulls last
  limit greatest(1,least(p_limit,100));
$$;
revoke all on function public.schedule_candidates(uuid,integer) from public;
grant execute on function public.schedule_candidates(uuid,integer) to authenticated;
-- Staff can read operational scheduling data through RLS; mutations remain RPC-only.
create policy staff_jobs_schedule_read on public.jobs for select to authenticated
using ((select private.has_permission('dispatch.manage')) or assigned_technician_id=public.current_technician_id());
create policy staff_tech_read on public.technicians for select to authenticated
using ((select private.has_permission('technicians.view')) or id=public.current_technician_id());
