create extension if not exists pgcrypto;
do $$ begin
  create type public.estimate_status as enum ('draft','sent','approved','declined','expired');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_status as enum ('pending','succeeded','failed','refunded','canceled');
exception when duplicate_object then null; end $$;
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  estimate_number text unique not null,
  job_id uuid not null references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  status public.estimate_status not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  expires_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (quantity * unit_price) stored
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_number text unique not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  job_id uuid references public.jobs(id) on delete set null,
  estimate_id uuid references public.estimates(id) on delete set null,
  provider text not null default 'stripe',
  provider_payment_id text,
  amount numeric(12,2) not null,
  currency text not null default 'usd',
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists estimates_job_idx on public.estimates(job_id);
create index if not exists payments_customer_idx on public.payments(customer_id, created_at desc);
create index if not exists payments_job_idx on public.payments(job_id, created_at desc);
alter table public.estimates enable row level security;
alter table public.estimate_items enable row level security;
alter table public.payments enable row level security;
create or replace function public.customer_approve_estimate(p_estimate_id uuid)
returns public.estimates
language plpgsql
security definer
set search_path = public
as $$
declare v_estimate public.estimates;
begin
  select e.* into v_estimate from public.estimates e
  where e.id = p_estimate_id and e.customer_id = (select id from public.customers where user_id = auth.uid());
  if v_estimate.id is null then raise exception 'Estimate not found'; end if;
  if v_estimate.status <> 'sent' then raise exception 'Estimate is not awaiting approval'; end if;
  update public.estimates set status='approved', approved_at=now(), updated_at=now()
  where id=p_estimate_id returning * into v_estimate;
  update public.jobs set estimate_id=p_estimate_id, subtotal=v_estimate.subtotal, tax=v_estimate.tax, total=v_estimate.total
  where id=v_estimate.job_id;
  return v_estimate;
end;
$$;
drop policy if exists estimates_customer_select on public.estimates;
create policy estimates_customer_select on public.estimates for select using (
  customer_id = (select id from public.customers where user_id = auth.uid())
);
drop policy if exists estimate_items_customer_select on public.estimate_items;
create policy estimate_items_customer_select on public.estimate_items for select using (
  estimate_id in (select id from public.estimates where customer_id = (select id from public.customers where user_id = auth.uid()))
);
drop policy if exists payments_customer_select on public.payments;
create policy payments_customer_select on public.payments for select using (
  customer_id = (select id from public.customers where user_id = auth.uid())
);
grant execute on function public.customer_approve_estimate(uuid) to authenticated;
