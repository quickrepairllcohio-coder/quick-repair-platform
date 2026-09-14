-- v2.2 Technician Skills, Certifications, Service Area & Route-aware Dispatch
create table if not exists public.technician_certifications (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  certification_type text not null,
  issuing_authority text,
  credential_number text,
  issued_on date,
  expires_on date,
  status text not null default 'active' check (status in ('active','expired','suspended','pending')),
  document_path text,
  verified_at timestamptz,
  verified_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index if not exists tech_cert_lookup on public.technician_certifications(technician_id,status,expires_on);
create table if not exists public.technician_service_areas (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  zip_code text,
  city text,
  state text,
  radius_miles numeric(7,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (zip_code is not null or city is not null or radius_miles is not null)
);
create index if not exists tech_area_lookup on public.technician_service_areas(technician_id,active,zip_code);
alter table public.technician_certifications enable row level security;
alter table public.technician_service_areas enable row level security;
create policy tech_cert_self_or_staff on public.technician_certifications for select to authenticated
using (technician_id=public.current_technician_id() or (select private.has_permission('technicians.view')));
create policy tech_area_self_or_staff on public.technician_service_areas for select to authenticated
using (technician_id=public.current_technician_id() or (select private.has_permission('technicians.view')));
-- Replace the v2.1 availability check so a slot must also be inside a scheduled shift when shifts exist.
create or replace function public.technician_is_available_for_slot(p_technician_id uuid,p_start timestamptz,p_end timestamptz)
returns boolean language plpgsql security definer set search_path='' stable as $$
declare v_day smallint; v_start time; v_end time;
begin
  if p_end <= p_start then return false; end if;
  if exists(select 1 from public.technician_time_off t where t.technician_id=p_technician_id and t.status='approved' and tstzrange(t.starts_at,t.ends_at,'[)') && tstzrange(p_start,p_end,'[)')) then return false; end if;
  if exists(select 1 from public.jobs j where j.assigned_technician_id=p_technician_id and j.scheduled_start is not null and j.scheduled_end is not null and tstzrange(j.scheduled_start,j.scheduled_end,'[)') && tstzrange(p_start,p_end,'[)')) then return false; end if;
  if exists(select 1 from public.technician_shifts s where s.technician_id=p_technician_id and s.status in ('scheduled','active') and s.starts_at::date=p_start::date)
     and not exists(select 1 from public.technician_shifts s where s.technician_id=p_technician_id and s.status in ('scheduled','active') and s.starts_at <= p_start and s.ends_at >= p_end) then return false; end if;
  v_day:=extract(dow from p_start at time zone 'UTC'); v_start:=(p_start at time zone 'UTC')::time; v_end:=(p_end at time zone 'UTC')::time;
  return exists(select 1 from public.technician_weekly_availability a where a.technician_id=p_technician_id and a.is_available and a.day_of_week=v_day and a.start_time<=v_start and a.end_time>=v_end);
end; $$;
create or replace function public.dispatch_candidates(p_job_id uuid,p_limit integer default 10)
returns table(technician_id uuid, technician_status text, skill_proficiency int, certification_ok boolean, service_area_ok boolean, available boolean, distance_miles numeric, score numeric, reason text)
language plpgsql security definer set search_path='' stable as $$
declare v_service_type uuid; v_lat double precision; v_lon double precision; v_zip text; v_city text; v_state text; v_start timestamptz; v_end timestamptz;
begin
  if not (select private.has_permission('dispatch.manage')) then raise exception 'forbidden'; end if;
  select sr.service_type_id,a.latitude,a.longitude,a.zip_code,a.city,a.state,j.scheduled_start,j.scheduled_end into v_service_type,v_lat,v_lon,v_zip,v_city,v_state,v_start,v_end
  from public.jobs j join public.service_requests sr on sr.id=j.request_id join public.properties p on p.id=j.property_id join public.addresses a on a.id=p.address_id where j.id=p_job_id;
  return query
  with latest as (select distinct on (tl.technician_id) tl.technician_id,tl.latitude,tl.longitude from public.technician_locations tl order by tl.technician_id,tl.recorded_at desc),
  base as (
    select t.id,t.status,
      coalesce(ts.proficiency,0)::int skill,
      exists(select 1 from public.technician_certifications c where c.technician_id=t.id and (case when c.status='active' then 'verified' else c.status end='verified' and (c.expires_on is null or c.expires_on>=current_date))) cert_ok,
      (exists(select 1 from public.technician_service_areas sa where sa.technician_id=t.id and sa.active and ((sa.zip_code is not null and sa.zip_code=v_zip) or (sa.city is not null and lower(sa.city)=lower(v_city) and (sa.state is null or lower(sa.state)=lower(v_state))))) or exists(select 1 from public.technician_service_areas sa where sa.technician_id=t.id and sa.active and sa.radius_miles is not null and l.latitude is not null and v_lat is not null and (3958.8*acos(least(1,greatest(-1,sin(radians(l.latitude))*sin(radians(v_lat))+cos(radians(l.latitude))*cos(radians(v_lat))*cos(radians(l.longitude-v_lon))))))<=sa.radius_miles)) area_ok,
      case when l.latitude is null or v_lat is null then null else round((3958.8*acos(least(1,greatest(-1,sin(radians(l.latitude))*sin(radians(v_lat))+cos(radians(l.latitude))*cos(radians(v_lat))*cos(radians(l.longitude-v_lon))))))::numeric,2) end dist,
      public.technician_is_available_for_slot(t.id,v_start,v_end) avail
    from public.technicians t left join public.technician_skills ts on ts.technician_id=t.id and ts.service_type_id=v_service_type and ts.verified=true left join latest l on l.technician_id=t.id
    where t.status in ('available','busy')
  )
  select id,status,skill,cert_ok,area_ok,avail,dist,
    (skill*25 + case when cert_ok then 25 else 0 end + case when area_ok then 20 else 0 end + case when avail then 40 else 0 end + case when status='available' then 15 else 0 end + coalesce(greatest(0,50-coalesce(dist,50)),0)*0.5)::numeric as score,
    concat_ws(', ',case when skill=0 then 'skill not verified' end,case when not cert_ok then 'certification not verified' end,case when not area_ok then 'outside service area' end,case when not avail then 'not available for slot' end) as reason
  from base order by avail desc,area_ok desc,cert_ok desc,score desc,dist nulls last limit greatest(1,least(p_limit,50));
end; $$;
revoke all on function public.dispatch_candidates(uuid,integer) from public;
grant execute on function public.dispatch_candidates(uuid,integer) to authenticated;
