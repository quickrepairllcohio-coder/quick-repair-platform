create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  estimate_id uuid references public.estimates(id) on delete set null,
  status text not null default 'open' check (status in ('draft','open','paid','void','past_due')),
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  change_order_number text unique not null,
  job_id uuid not null references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  description text not null,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','sent','approved','declined','cancelled')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.change_order_items (
  id uuid primary key default gen_random_uuid(),
  change_order_id uuid not null references public.change_orders(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) generated always as (quantity * unit_price) stored
);
alter table public.invoices enable row level security;
alter table public.change_orders enable row level security;
alter table public.change_order_items enable row level security;
create policy invoices_customer_select on public.invoices for select to authenticated using (
  customer_id = (select id from public.customers where user_id = auth.uid())
);
create policy change_orders_customer_select on public.change_orders for select to authenticated using (
  customer_id = (select id from public.customers where user_id = auth.uid())
);
create policy change_order_items_customer_select on public.change_order_items for select to authenticated using (
  change_order_id in (select id from public.change_orders where customer_id = (select id from public.customers where user_id = auth.uid()))
);
create or replace function public.customer_approve_change_order(p_change_order_id uuid)
returns public.change_orders
language plpgsql security definer set search_path=public
as $$
declare v_co public.change_orders;
begin
  select co.* into v_co from public.change_orders co
  where co.id=p_change_order_id
    and co.customer_id=(select id from public.customers where user_id=auth.uid());
  if v_co.id is null then raise exception 'Change order not found'; end if;
  if v_co.status <> 'sent' then raise exception 'Change order is not awaiting approval'; end if;
  update public.change_orders set status='approved', approved_at=now(), updated_at=now()
  where id=p_change_order_id returning * into v_co;
  update public.jobs set subtotal=subtotal+v_co.subtotal, tax=tax+v_co.tax, total=total+v_co.total, updated_at=now()
  where id=v_co.job_id;
  return v_co;
end;
$$;
grant execute on function public.customer_approve_change_order(uuid) to authenticated;
create or replace function public.ensure_invoice_for_job(p_job_id uuid)
returns public.invoices
language plpgsql security definer set search_path=public
as $$
declare v_job public.jobs; v_inv public.invoices; 
begin
  if public.current_user_role() not in ('finance','dispatcher','supervisor','admin','super_admin') then raise exception 'Not authorized'; end if;
  select * into v_job from public.jobs where id=p_job_id;
  if v_job.id is null then raise exception 'Job not found'; end if;
  select * into v_inv from public.invoices where job_id=p_job_id order by created_at desc limit 1;
  if v_inv.id is not null then return v_inv; end if;
  insert into public.invoices(invoice_number,customer_id,job_id,estimate_id,subtotal,tax,total,due_at)
  values('INV-'||to_char(now(),'YYYYMMDDHH24MISSMS'),v_job.customer_id,v_job.id,v_job.estimate_id,v_job.subtotal,v_job.tax,v_job.total,now()+interval '7 days')
  returning * into v_inv;
  return v_inv;
end;
$$;
grant execute on function public.ensure_invoice_for_job(uuid) to authenticated;
create or replace function public.mark_invoice_paid_from_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare p public.payments;
begin
  select * into p from public.payments where id=p_payment_id;
  if p.id is null or p.status <> 'succeeded' then return; end if;
  update public.invoices set status='paid', paid_at=coalesce(p.updated_at,now()), updated_at=now()
  where job_id=p.job_id and status in ('open','past_due');
end;
$$;
grant execute on function public.mark_invoice_paid_from_payment(uuid) to service_role;
