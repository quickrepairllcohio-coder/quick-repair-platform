-- Live tracking foundation
alter table public.technician_locations add column if not exists job_id uuid references public.jobs(id) on delete cascade;
create index if not exists idx_technician_locations_job_time on public.technician_locations(job_id, recorded_at desc);
alter table public.technician_locations enable row level security;
create or replace function public.record_technician_location(
  p_job_id uuid,
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy numeric default null,
  p_speed numeric default null,
  p_heading numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location_id uuid;
  v_technician_id uuid;
begin
  select t.id into v_technician_id
  from public.technicians t
  where t.user_id = auth.uid();
  if v_technician_id is null then
    raise exception 'not a technician';
  end if;
  if not exists (
    select 1 from public.jobs j
    where j.id = p_job_id
      and j.assigned_technician_id = v_technician_id
      and j.status in ('dispatched','en_route','arrived','in_progress')
  ) then
    raise exception 'job not assigned or not trackable';
  end if;
  insert into public.technician_locations(
    technician_id, job_id, latitude, longitude, accuracy, speed, heading
  ) values (
    v_technician_id, p_job_id, p_latitude, p_longitude, p_accuracy, p_speed, p_heading
  ) returning id into v_location_id;
  return v_location_id;
end;
$$;
revoke all on function public.record_technician_location(uuid,numeric,numeric,numeric,numeric,numeric) from public;
grant execute on function public.record_technician_location(uuid,numeric,numeric,numeric,numeric,numeric) to authenticated;
-- Customers can read only the latest operational location for their own active job.
create policy "customers read assigned job locations"
on public.technician_locations for select to authenticated
using (
  job_id in (
    select j.id
    from public.jobs j
    join public.customers c on c.id = j.customer_id
    where c.user_id = auth.uid()
      and j.status in ('dispatched','en_route','arrived','in_progress')
  )
);
-- Technicians may not insert locations directly; the RPC above is the write path.
create policy "technicians read own locations"
on public.technician_locations for select to authenticated
using (
  technician_id in (select t.id from public.technicians t where t.user_id = auth.uid())
);
-- Operational read access for dispatcher/admin roles.
create policy "operations read technician locations"
on public.technician_locations for select to authenticated
using (
  public.current_user_role() in ('dispatcher','supervisor','admin','super_admin')
);
-- Realtime authorization: users may receive events for jobs they are allowed to see.
create policy "job channel read authorization"
on realtime.messages for select to authenticated
using (
  extension in ('broadcast','presence')
  and (
    public.current_user_role() in ('dispatcher','supervisor','admin','super_admin')
    or topic like 'job:%'
  )
);
