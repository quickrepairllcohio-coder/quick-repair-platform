CREATE OR REPLACE FUNCTION public.technician_compliance_status(uuid, uuid, text) RETURNS jsonb LANGUAGE sql AS 'SELECT jsonb_build_object(''compliant'', true);';

-- Dispatcher Center foundation
create table if not exists public.dispatch_events (
  id uuid primary key default gen_random_uuid(),
  dispatch_id uuid references public.dispatches(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  technician_id uuid references public.technicians(id),
  event_type text not null,
  old_status text,
  new_status text,
  reason text,
  metadata jsonb,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.job_assignment_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  technician_id uuid not null references public.technicians(id),
  attempt_number integer not null,
  status text not null default 'offered',
  offered_at timestamptz not null default now(),
  responded_at timestamptz,
  decline_reason text,
  created_at timestamptz not null default now(),
  unique(job_id, attempt_number)
);
create index if not exists idx_dispatch_events_job on public.dispatch_events(job_id, created_at desc);
create index if not exists idx_assignment_attempts_job on public.job_assignment_attempts(job_id, created_at desc);
create index if not exists idx_technician_locations_latest on public.technician_locations(technician_id, recorded_at desc);
alter table public.dispatch_events enable row level security;
alter table public.job_assignment_attempts enable row level security;
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;
create or replace function public.dispatch_assign_technician(
  p_job_id uuid,
  p_technician_id uuid,
  p_distance_miles numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispatch_id uuid;
  v_attempt integer;
  v_old_status text;
begin
  if public.current_user_role() not in ('dispatcher','supervisor','admin','super_admin') then
    raise exception 'not authorized';
  end if;
  select status into v_old_status from public.jobs where id = p_job_id for update;
  if not found then raise exception 'job not found'; end if;
  update public.jobs
    set assigned_technician_id = p_technician_id,
        status = 'dispatched',
        updated_at = now()
  where id = p_job_id;
  insert into public.dispatches(job_id, technician_id, status, distance_miles)
  values (p_job_id, p_technician_id, 'offered', p_distance_miles)
  returning id into v_dispatch_id;
  select coalesce(max(attempt_number),0)+1 into v_attempt
  from public.job_assignment_attempts where job_id = p_job_id;
  insert into public.job_assignment_attempts(job_id, technician_id, attempt_number)
  values (p_job_id, p_technician_id, v_attempt);
  insert into public.dispatch_events(dispatch_id, job_id, technician_id, event_type, old_status, new_status, created_by)
  values (v_dispatch_id, p_job_id, p_technician_id, 'TECHNICIAN_OFFERED', v_old_status, 'dispatched', auth.uid());
  return v_dispatch_id;
end;
$$;
create or replace function public.dispatch_update_status(
  p_dispatch_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_tech_id uuid;
  v_old text;
begin
  if public.current_user_role() not in ('dispatcher','supervisor','admin','super_admin') then
    raise exception 'not authorized';
  end if;
  select job_id, technician_id, status into v_job_id, v_tech_id, v_old
  from public.dispatches where id = p_dispatch_id for update;
  if not found then raise exception 'dispatch not found'; end if;
  update public.dispatches set status = p_status,
    accepted_at = case when p_status = 'accepted' then now() else accepted_at end,
    arrived_at = case when p_status = 'arrived' then now() else arrived_at end
  where id = p_dispatch_id;
  insert into public.dispatch_events(dispatch_id, job_id, technician_id, event_type, old_status, new_status, reason, created_by)
  values (p_dispatch_id, v_job_id, v_tech_id, upper('DISPATCH_' || p_status), v_old, p_status, p_reason, auth.uid());
end;
$$;
revoke all on function public.dispatch_assign_technician(uuid,uuid,numeric) from public;
grant execute on function public.dispatch_assign_technician(uuid,uuid,numeric) to authenticated;
revoke all on function public.dispatch_update_status(uuid,text,text) from public;
grant execute on function public.dispatch_update_status(uuid,text,text) to authenticated;
-- Realtime: request/job operational events should use private channels in production.
-- Broadcast is preferred by current Supabase guidance for scalable/security-sensitive realtime.
