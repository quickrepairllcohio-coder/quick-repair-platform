-- v1.9 Vendor & Expense Management
create type public.expense_scope as enum ('job','company','overhead');
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  tax_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_number text not null unique,
  vendor_id uuid references public.vendors(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  scope public.expense_scope not null default 'company',
  category text not null,
  description text,
  expense_date date not null default current_date,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  tax numeric(12,2) not null default 0 check (tax >= 0),
  total numeric(12,2) generated always as (subtotal + tax) stored,
  payment_method text,
  receipt_path text,
  status text not null default 'recorded' check (status in ('recorded','void')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists expenses_job_idx on public.expenses(job_id, expense_date desc);
create index if not exists expenses_vendor_idx on public.expenses(vendor_id, expense_date desc);
create index if not exists expenses_date_idx on public.expenses(expense_date desc);
alter table public.vendors enable row level security;
alter table public.expenses enable row level security;
drop policy if exists vendors_staff_read on public.vendors;
create policy vendors_staff_read on public.vendors for select to authenticated
using (public.current_user_role() in ('dispatcher','finance','admin','super_admin','supervisor'));
drop policy if exists expenses_staff_read on public.expenses;
create policy expenses_staff_read on public.expenses for select to authenticated
using (public.current_user_role() in ('dispatcher','finance','admin','super_admin','supervisor'));
drop policy if exists expenses_finance_write on public.expenses;
create policy expenses_finance_write on public.expenses for all to authenticated
using (public.current_user_role() in ('finance','admin','super_admin','supervisor'))
with check (public.current_user_role() in ('finance','admin','super_admin','supervisor'));
drop policy if exists vendors_finance_write on public.vendors;
create policy vendors_finance_write on public.vendors for all to authenticated
using (public.current_user_role() in ('finance','admin','super_admin','supervisor'))
with check (public.current_user_role() in ('finance','admin','super_admin','supervisor','admin','finance'));
create or replace function public.create_expense(
  p_vendor_id uuid,
  p_job_id uuid,
  p_scope public.expense_scope,
  p_category text,
  p_description text,
  p_expense_date date,
  p_subtotal numeric,
  p_tax numeric,
  p_payment_method text default null,
  p_receipt_path text default null
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_num text;
begin
  if public.current_user_role() not in ('finance','admin','super_admin','supervisor') then raise exception 'forbidden'; end if;
  if p_subtotal < 0 or p_tax < 0 then raise exception 'invalid amount'; end if;
  if p_scope = 'job' and p_job_id is null then raise exception 'job required for job expense'; end if;
  v_num := 'EXP-' || to_char(coalesce(p_expense_date,current_date),'YYYY') || '-' || lpad((select count(*)+1 from public.expenses where expense_date >= date_trunc('year',coalesce(p_expense_date,current_date))::date and expense_date < (date_trunc('year',coalesce(p_expense_date,current_date)) + interval '1 year')::date)::text,6,'0');
  insert into public.expenses(expense_number,vendor_id,job_id,scope,category,description,expense_date,subtotal,tax,payment_method,receipt_path,created_by)
  values(v_num,p_vendor_id,p_job_id,p_scope,p_category,p_description,coalesce(p_expense_date,current_date),p_subtotal,p_tax,p_payment_method,p_receipt_path,auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.create_expense(uuid,uuid,public.expense_scope,text,text,date,numeric,numeric,text,text) to authenticated;
create or replace function public.expense_summary(p_from date default current_date - 29, p_to date default current_date)
returns jsonb language sql security definer set search_path=''
as $$
  select jsonb_build_object(
    'from',p_from,'to',p_to,
    'total',coalesce(sum(e.total),0),
    'job_expenses',coalesce(sum(case when e.scope='job' then e.total else 0 end),0),
    'company_expenses',coalesce(sum(case when e.scope in ('company','overhead') then e.total else 0 end),0),
    'tax',coalesce(sum(e.tax),0),
    'count',count(*)
  )
  from public.expenses e
  where e.status='recorded' and e.expense_date between p_from and p_to
    and public.current_user_role() in ('finance','admin','super_admin','supervisor');
$$;
grant execute on function public.expense_summary(date,date) to authenticated;
