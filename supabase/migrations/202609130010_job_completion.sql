create table if not exists public.job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null,
  changed_by uuid references public.users(id),
  reason text,
  created_at timestamptz not null default now()
);
create table if not exists public.job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  label text not null,
  required boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.users(id),
  sort_order integer not null default 0
);
create table if not exists public.job_media (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  media_type text not null check (media_type in ('before','after','material','document','other')),
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.job_materials (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_cost numeric(12,2) not null default 0,
  vendor text,
  receipt_path text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.job_completion_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  technician_id uuid not null references public.technicians(id),
  work_summary text not null,
  customer_notes text,
  customer_signature text,
  signed_at timestamptz,
  warranty_days integer not null default 30,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.job_status_history enable row level security;
alter table public.job_checklist_items enable row level security;
alter table public.job_media enable row level security;
alter table public.job_materials enable row level security;
alter table public.job_completion_reports enable row level security;
create or replace function public.current_technician_id()
returns uuid language sql security definer set search_path=public stable as $$
  select id from public.technicians where user_id=auth.uid() limit 1;
$$;
revoke all on function public.current_technician_id() from public;
grant execute on function public.current_technician_id() to authenticated;
create policy job_history_tech_read on public.job_status_history for select to authenticated
using (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()));
create policy job_checklist_tech_all on public.job_checklist_items for all to authenticated
using (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()))
with check (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()));
create policy job_media_tech_all on public.job_media for all to authenticated
using (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()))
with check (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()));
create policy job_materials_tech_all on public.job_materials for all to authenticated
using (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()))
with check (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()));
create policy job_completion_tech_all on public.job_completion_reports for all to authenticated
using (technician_id=public.current_technician_id())
with check (technician_id=public.current_technician_id());
create policy job_media_customer_read on public.job_media for select to authenticated using (
  job_id in (select j.id from public.jobs j join public.customers c on c.id=j.customer_id where c.user_id=auth.uid())
);
create policy job_completion_customer_read on public.job_completion_reports for select to authenticated using (
  job_id in (select j.id from public.jobs j join public.customers c on c.id=j.customer_id where c.user_id=auth.uid())
);
create or replace function public.technician_complete_job(
  p_job_id uuid,
  p_work_summary text,
  p_customer_notes text default null,
  p_customer_signature text default null,
  p_warranty_days integer default 30
)
returns public.job_completion_reports
language plpgsql security definer set search_path=public
as $$
declare v_job public.jobs; v_tech uuid; v_report public.job_completion_reports;
begin
  v_tech := public.current_technician_id();
  select * into v_job from public.jobs where id=p_job_id and assigned_technician_id=v_tech;
  if v_job.id is null then raise exception 'Job not found or not assigned to technician'; end if;
  if v_job.status <> 'in_progress' then raise exception 'Job must be in_progress'; end if;
  if coalesce(trim(p_work_summary),'')='' then raise exception 'Work summary is required'; end if;
  if exists(select 1 from public.job_checklist_items where job_id=p_job_id and required=true and completed=false) then
    raise exception 'Required checklist items are incomplete';
  end if;
  insert into public.job_completion_reports(job_id,technician_id,work_summary,customer_notes,customer_signature,signed_at,warranty_days)
  values(p_job_id,v_tech,p_work_summary,p_customer_notes,p_customer_signature,case when p_customer_signature is null then null else now() end,greatest(0,p_warranty_days))
  on conflict(job_id) do update set work_summary=excluded.work_summary,customer_notes=excluded.customer_notes,customer_signature=excluded.customer_signature,signed_at=excluded.signed_at,warranty_days=excluded.warranty_days
  returning * into v_report;
  update public.jobs set status='completed',check_out_at=now(),updated_at=now() where id=p_job_id;
  insert into public.job_status_history(job_id,status,changed_by,reason) values(p_job_id,'completed',(select user_id from public.technicians where id=v_tech),'Technician completion report submitted');
  return v_report;
end;
$$;
grant execute on function public.technician_complete_job(uuid,text,text,text,integer) to authenticated;
