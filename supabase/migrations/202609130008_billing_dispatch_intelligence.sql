create table if not exists public.technician_skills (
  technician_id uuid not null references public.technicians(id) on delete cascade,
  service_type_id uuid not null references public.service_types(id) on delete cascade,
  proficiency smallint not null default 1 check (proficiency between 1 and 5),
  verified boolean not null default false,
  primary key (technician_id, service_type_id)
);
create index if not exists technician_skills_service_idx on public.technician_skills(service_type_id, technician_id);
alter table public.technician_skills enable row level security;
drop policy if exists technician_skills_dispatch_select on public.technician_skills;
create policy technician_skills_dispatch_select on public.technician_skills for select using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin'));
do $$ begin
  alter table public.payments add column if not exists checkout_session_id text unique;
  alter table public.payments add column if not exists payment_intent_id text;
  alter table public.payments add column if not exists failure_message text;
exception when duplicate_column then null; end $$;
create index if not exists payments_checkout_idx on public.payments(checkout_session_id);
create or replace function public.recommend_technicians(p_job_id uuid, p_limit int default 10)
returns table(technician_id uuid, distance_miles numeric, skill_score int, availability_score int, total_score numeric)
language plpgsql security definer set search_path=public
as $$
declare v_role text; v_lat double precision; v_lon double precision; v_service_type uuid;
begin
  select public.current_user_role() into v_role;
  if v_role not in ('dispatcher','supervisor','admin','super_admin') then raise exception 'Not authorized'; end if;
  select a.latitude, a.longitude, sr.service_type_id into v_lat, v_lon, v_service_type
  from jobs j join service_requests sr on sr.id=j.request_id join properties p on p.id=j.property_id join addresses a on a.id=p.address_id
  where j.id=p_job_id;
  return query
  with latest as (
    select distinct on (tl.technician_id) tl.technician_id, tl.latitude, tl.longitude
    from technician_locations tl order by tl.technician_id, tl.recorded_at desc
  )
  select t.id,
    round((3958.8 * acos(least(1,greatest(-1,
      cos(radians(v_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(v_lon))+sin(radians(v_lat))*sin(radians(l.latitude))
    ))))::numeric,2) as distance_miles,
    coalesce(ts.proficiency,0)::int as skill_score,
    case when t.status='available' then 30 when t.status='busy' then 5 else 0 end as availability_score,
    (coalesce(ts.proficiency,0)*20 + case when t.status='available' then 30 when t.status='busy' then 5 else 0 end -
      coalesce((3958.8 * acos(least(1,greatest(-1,cos(radians(v_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(v_lon))+sin(radians(v_lat))*sin(radians(l.latitude))))))::numeric,1000)*2) as total_score
  from technicians t
  left join technician_skills ts on ts.technician_id=t.id and ts.service_type_id=v_service_type and ts.verified=true
  left join latest l on l.technician_id=t.id
  where t.status in ('available','busy')
    and (l.latitude is null or (3958.8 * acos(least(1,greatest(-1,cos(radians(v_lat))*cos(radians(l.latitude))*cos(radians(l.longitude)-radians(v_lon))+sin(radians(v_lat))*sin(radians(l.latitude)))))) <= coalesce(t.service_radius_miles,50))
  order by total_score desc nulls last limit greatest(1,least(p_limit,50));
end;
$$;
grant execute on function public.recommend_technicians(uuid,int) to authenticated;
create or replace function public.create_checkout_payment(p_estimate_id uuid)
returns public.payments
language plpgsql security definer set search_path=public
as $$
declare e public.estimates; p public.payments; c uuid;
begin
  select id into c from customers where user_id=auth.uid();
  select * into e from estimates where id=p_estimate_id and customer_id=c;
  if e.id is null then raise exception 'Estimate not found'; end if;
  if e.status <> 'approved' then raise exception 'Estimate must be approved before payment'; end if;
  select * into p from payments where estimate_id=e.id and status='pending' order by created_at desc limit 1;
  if p.id is not null then return p; end if;
  insert into payments(payment_number,customer_id,job_id,estimate_id,amount,currency,status)
  values('PAY-'||to_char(now(),'YYYYMMDDHH24MISSMS'),c,e.job_id,e.id,e.total,'usd','pending') returning * into p;
  return p;
end;
$$;
grant execute on function public.create_checkout_payment(uuid) to authenticated;
