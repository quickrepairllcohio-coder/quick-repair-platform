create table if not exists public.warranties (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  terms text not null default 'Workmanship warranty',
  status text not null default 'active' check (status in ('active','expired','void')),
  created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
-- Notifications are defined in migration 202609130012_notifications_communication.sql to avoid schema drift.
create or replace function public.customer_home_history()
returns table (
  job_id uuid,
  job_number text,
  service_name text,
  completed_at timestamptz,
  total numeric,
  warranty_expires_at timestamptz,
  warranty_status text,
  review_rating integer
)
language sql security definer set search_path=public stable
as $$
  select j.id, j.job_number, coalesce(st.name, 'Home repair'), r.completed_at,
         j.total, w.expires_at, w.status, rv.rating
  from public.jobs j
  join public.customers c on c.id=j.customer_id
  left join public.service_requests sr on sr.id=j.request_id
  left join public.service_types st on st.id=sr.service_type_id
  left join public.job_completion_reports r on r.job_id=j.id
  left join public.warranties w on w.job_id=j.id
  left join public.reviews rv on rv.job_id=j.id
  where c.user_id=auth.uid() and j.status='completed'
  order by coalesce(r.completed_at,j.updated_at) desc;
$$;
revoke all on function public.customer_home_history() from public;
grant execute on function public.customer_home_history() to authenticated;
create or replace function public.customer_create_review(p_job_id uuid,p_rating integer,p_comment text default null)
returns public.reviews
language plpgsql security definer set search_path=public
as $$
declare v_customer uuid; v_review public.reviews;
begin
  v_customer := (select id from public.customers where user_id=auth.uid());
  if v_customer is null then raise exception 'Customer not found'; end if;
  if p_rating < 1 or p_rating > 5 then raise exception 'Rating must be 1-5'; end if;
  if not exists(select 1 from public.jobs where id=p_job_id and customer_id=v_customer and status='completed') then raise exception 'Completed job not found'; end if;
  insert into public.reviews(job_id,customer_id,rating,comment)
  values(p_job_id,v_customer,p_rating,p_comment)
  on conflict(job_id) do update set rating=excluded.rating,comment=excluded.comment
  returning * into v_review;
  return v_review;
end;
$$;
revoke all on function public.customer_create_review(uuid,integer,text) from public;
grant execute on function public.customer_create_review(uuid,integer,text) to authenticated;
create or replace function public.customer_mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.notifications n
  set read_at=now()
  where n.id=p_notification_id
    and n.user_id=auth.uid();
end;
$$;
revoke all on function public.customer_mark_notification_read(uuid) from public;
grant execute on function public.customer_mark_notification_read(uuid) to authenticated;
create or replace function public.create_warranty_for_completed_job(p_job_id uuid,p_days integer default 30)
returns public.warranties
language plpgsql security definer set search_path=public
as $$
declare v_job public.jobs; v_w public.warranties;
begin
  if public.current_user_role() not in ('technician','dispatcher','supervisor','finance','admin','super_admin') then raise exception 'Not authorized'; end if;
  select * into v_job from public.jobs where id=p_job_id and status='completed';
  if v_job.id is null then raise exception 'Completed job not found'; end if;
  insert into public.warranties(job_id,customer_id,starts_at,expires_at)
  values(p_job_id,v_job.customer_id,now(),now()+make_interval(days=>greatest(0,p_days)))
  on conflict(job_id) do update set expires_at=excluded.expires_at,status='active'
  returning * into v_w;
  return v_w;
end;
$$;
revoke all on function public.create_warranty_for_completed_job(uuid,integer) from public;
grant execute on function public.create_warranty_for_completed_job(uuid,integer) to authenticated;
