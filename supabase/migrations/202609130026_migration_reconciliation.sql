-- v3.4 migration reconciliation / scheduling hardening
-- This migration is intentionally additive and idempotent. It does not rewrite prior migrations.
-- Replace the v2.1 availability calculation so a technician must have both:
--   1) no overlapping job/time-off, and
--   2) a matching weekly availability window OR an explicit shift window.
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
  v_weekly boolean;
  v_shift boolean;
begin
  if p_end <= p_start then return false; end if;
  if exists (
    select 1 from public.technician_time_off t
    where t.technician_id=p_technician_id
      and t.status='approved'
      and tstzrange(t.starts_at,t.ends_at,'[)') && tstzrange(p_start,p_end,'[)')
  ) then return false; end if;
  if exists (
    select 1 from public.jobs j
    where j.assigned_technician_id=p_technician_id
      and j.scheduled_start is not null and j.scheduled_end is not null
      and j.id is not null
      and tstzrange(j.scheduled_start,j.scheduled_end,'[)') && tstzrange(p_start,p_end,'[)')
  ) then return false; end if;
  v_day := extract(dow from p_start at time zone 'UTC');
  v_start := (p_start at time zone 'UTC')::time;
  v_end := (p_end at time zone 'UTC')::time;
  select exists (
    select 1 from public.technician_weekly_availability a
    where a.technician_id=p_technician_id
      and a.is_available
      and a.day_of_week=v_day
      and a.start_time <= v_start
      and a.end_time >= v_end
  ) into v_weekly;
  select exists (
    select 1 from public.technician_shifts s
    where s.technician_id=p_technician_id
      and s.status in ('scheduled','active')
      and s.starts_at <= p_start
      and s.ends_at >= p_end
  ) into v_shift;
  return coalesce(v_weekly,false) or coalesce(v_shift,false);
end;
$$;
-- Make conflict detection explicitly report approved time-off and overlapping jobs.
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
    and tstzrange(t.starts_at,t.ends_at,'[)') && tstzrange(p_start,p_end,'[)');
$$;
revoke all on function public.technician_is_available_for_slot(uuid,timestamptz,timestamptz) from public;
grant execute on function public.technician_is_available_for_slot(uuid,timestamptz,timestamptz) to authenticated;
revoke all on function public.scheduling_conflicts(uuid,timestamptz,timestamptz,uuid) from public;
grant execute on function public.scheduling_conflicts(uuid,timestamptz,timestamptz,uuid) to authenticated;
create index if not exists jobs_assigned_schedule_range_idx
on public.jobs using gist (tstzrange(scheduled_start,scheduled_end,'[)'))
where assigned_technician_id is not null and scheduled_start is not null and scheduled_end is not null;
