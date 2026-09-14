-- Quick Repair v2.1 Financial & Business Intelligence Engine
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('debit','credit')),
  account_category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  reference_type text,
  reference_id uuid,
  description text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'ledger_entries' 
      AND column_name = 'source_type'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_source_unique') THEN ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_source_unique UNIQUE(source_type, source_id); END IF;
  END IF;
EXCEPTION 
  WHEN duplicate_object THEN NULL; 
  WHEN duplicate_column THEN NULL; 
  WHEN undefined_column THEN NULL; 
END $$;
-- -----------------------------------------------------------------------------
-- Labor Entries & Cost Tracking
-- -----------------------------------------------------------------------------
create table if not exists public.job_labor_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  technician_id uuid references public.technicians(id) on delete set null,
  hours numeric(10,2) not null check (hours >= 0),
  cost_rate numeric(12,2) not null check (cost_rate >= 0),
  description text,
  created_at timestamptz not null default now()
);
create index if not exists job_labor_job_idx on public.job_labor_entries(job_id);
create index if not exists job_labor_tech_idx on public.job_labor_entries(technician_id, created_at desc);
alter table public.job_labor_entries enable row level security;
drop policy if exists job_labor_tech_read on public.job_labor_entries;
create policy job_labor_tech_read on public.job_labor_entries for select to authenticated
using (job_id in (select id from public.jobs where assigned_technician_id=public.current_technician_id()));
-- -----------------------------------------------------------------------------
-- Financial Reports & Analytics
-- -----------------------------------------------------------------------------
create or replace function public.finance_dashboard(p_from date default current_date - 29, p_to date default current_date)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare r jsonb;
begin
  if public.current_user_role() not in ('finance','admin','super_admin','supervisor') then raise exception 'forbidden'; end if;
  if p_to < p_from then raise exception 'invalid date range'; end if;
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'revenue', coalesce((select sum(amount) from public.payments where status='succeeded' and created_at >= p_from and created_at < p_to + 1),0),
    'payments_count', (select count(*) from public.payments where status='succeeded' and created_at >= p_from and created_at < p_to + 1),
    'refunds', coalesce((select sum(amount) from public.payments where status='refunded' and updated_at >= p_from and updated_at < p_to + 1),0),
    'ar_open', coalesce((select sum(total) from public.invoices where status in ('open','past_due')),0),
    'jobs_completed', (select count(*) from public.jobs where status='completed' and check_out_at >= p_from and check_out_at < p_to + 1),
    'material_cost', coalesce((select sum(jm.quantity * jm.unit_cost) from public.job_materials jm join public.jobs j on j.id=jm.job_id where j.check_out_at >= p_from and j.check_out_at < p_to + 1),0),
    'labor_cost', coalesce((select sum(jl.hours * jl.cost_rate) from public.job_labor_entries jl join public.jobs j on j.id=jl.job_id where j.check_out_at >= p_from and j.check_out_at < p_to + 1),0),
    'gross_profit', coalesce((select sum(j.total) from public.jobs j where j.status='completed' and j.check_out_at >= p_from and j.check_out_at < p_to + 1),0)
      - coalesce((select sum(jm.quantity * jm.unit_cost) from public.job_materials jm join public.jobs j on j.id=jm.job_id where j.check_out_at >= p_from and j.check_out_at < p_to + 1),0)
      - coalesce((select sum(jl.hours * jl.cost_rate) from public.job_labor_entries jl join public.jobs j on j.id=jl.job_id where j.check_out_at >= p_from and j.check_out_at < p_to + 1),0)
  ) into r;
  return r;
end;
$$;
grant execute on function public.finance_dashboard(date,date) to authenticated;
create or replace function public.job_profitability_report(p_from date default current_date - 29, p_to date default current_date)
returns table(
  job_id uuid,
  job_number text,
  customer_id uuid,
  completed_at timestamptz,
  revenue numeric,
  material_cost numeric,
  labor_cost numeric,
  gross_profit numeric,
  gross_margin_pct numeric
)
language sql security definer set search_path=public
as $$
  select j.id, j.job_number, j.customer_id, j.check_out_at,
    j.total,
    coalesce((select sum(m.quantity*m.unit_cost) from public.job_materials m where m.job_id=j.id),0),
    coalesce((select sum(l.hours*l.cost_rate) from public.job_labor_entries l where l.job_id=j.id),0),
    j.total - coalesce((select sum(m.quantity*m.unit_cost) from public.job_materials m where m.job_id=j.id),0) - coalesce((select sum(l.hours*l.cost_rate) from public.job_labor_entries l where l.job_id=j.id),0),
    case when j.total=0 then 0 else round(((j.total - coalesce((select sum(m.quantity*m.unit_cost) from public.job_materials m where m.job_id=j.id),0) - coalesce((select sum(l.hours*l.cost_rate) from public.job_labor_entries l where l.job_id=j.id),0)) / j.total) * 100,2) end
  from public.jobs j
  where j.status='completed' and j.check_out_at >= p_from and j.check_out_at < p_to + 1
  and public.current_user_role() in ('finance','admin','super_admin','supervisor')
  order by j.check_out_at desc;
$$;
grant execute on function public.job_profitability_report(date,date) to authenticated;
create or replace function public.technician_performance_report(p_from date default current_date - 29, p_to date default current_date)
returns table(
  technician_id uuid,
  technician_name text,
  completed_jobs bigint,
  revenue numeric,
  labor_cost numeric,
  average_job_value numeric
)
language sql security definer set search_path=public
as $$
  select t.id,
    trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')),
    count(j.id),
    coalesce(sum(j.total),0),
    coalesce(sum((select sum(l.hours*l.cost_rate) from public.job_labor_entries l where l.job_id=j.id)),0),
    coalesce(avg(j.total),0)
  from public.technicians t
  join public.users u on u.id=t.user_id
  left join public.jobs j on j.assigned_technician_id=t.id and j.status='completed' and j.check_out_at >= p_from and j.check_out_at < p_to + 1
  where public.current_user_role() in ('finance','admin','super_admin','supervisor')
  group by t.id,u.first_name,u.last_name
  order by completed_jobs desc;
$$;
grant execute on function public.technician_performance_report(date,date) to authenticated;
create or replace function public.customer_ltv_report(p_limit integer default 100)
returns table(customer_id uuid, customer_name text, jobs_count bigint, lifetime_revenue numeric, average_job_value numeric, last_job_at timestamptz)
language sql security definer set search_path=public
as $$
  select c.id,
    trim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')),
    count(j.id),
    coalesce(sum(j.total),0),
    coalesce(avg(j.total),0),
    max(j.check_out_at)
  from public.customers c
  join public.users u on u.id=c.user_id
  left join public.jobs j on j.customer_id=c.id and j.status='completed'
  where public.current_user_role() in ('finance','admin','super_admin','supervisor')
  group by c.id,u.first_name,u.last_name
  order by coalesce(sum(j.total),0) desc
  limit greatest(1,least(p_limit,1000));
$$;
grant execute on function public.customer_ltv_report(integer) to authenticated;
create or replace function public.tax_summary(p_from date default current_date - 29, p_to date default current_date)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare r jsonb;
begin
  if public.current_user_role() not in ('finance','admin','super_admin') then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'from',p_from,'to',p_to,
    'gross_sales_tax',coalesce((select sum(j.tax) from public.jobs j where j.status='completed' and j.check_out_at >= p_from and j.check_out_at < p_to+1),0),
    'invoice_tax',coalesce((select sum(i.tax) from public.invoices i where i.created_at >= p_from and i.created_at < p_to+1),0),
    'note','Tax amounts are operational summaries only; final filing treatment requires the company tax setup and transaction classification.'
  ) into r;
  return r;
end;
$$;
grant execute on function public.tax_summary(date,date) to authenticated;
