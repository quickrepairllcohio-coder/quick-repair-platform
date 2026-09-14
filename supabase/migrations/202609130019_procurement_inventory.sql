-- Quick Repair v2.0 Procurement & Inventory
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  description text,
  unit text not null default 'each',
  reorder_point numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text unique not null,
  vendor_id uuid not null references public.vendors(id),
  job_id uuid references public.jobs(id),
  status text not null default 'draft' check (status in ('draft','sent','partially_received','received','cancelled')),
  ordered_at timestamptz,
  expected_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  received_quantity numeric(12,2) not null default 0 check (received_quantity >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_cost) stored
);
create table if not exists public.inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text unique not null,
  purchase_order_id uuid not null references public.purchase_orders(id),
  received_at timestamptz not null default now(),
  received_by uuid references public.users(id),
  notes text
);
create table if not exists public.inventory_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.inventory_receipts(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0)
);
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id),
  job_id uuid references public.jobs(id),
  transaction_type text not null check (transaction_type in ('receipt','issue_to_job','adjustment','return')),
  quantity numeric(12,2) not null check (quantity <> 0),
  unit_cost numeric(12,2) not null default 0,
  source_receipt_id uuid references public.inventory_receipts(id),
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_inventory_tx_material on public.inventory_transactions(material_id, created_at desc);
create index if not exists idx_inventory_tx_job on public.inventory_transactions(job_id, created_at desc);
create index if not exists idx_po_vendor_status on public.purchase_orders(vendor_id, status);
create or replace function public.inventory_on_hand(p_material_id uuid)
returns numeric language sql stable security invoker set search_path = public as $$
  select coalesce(sum(quantity),0) from public.inventory_transactions where material_id = p_material_id;
$$;
create or replace function public.create_purchase_order(p_vendor_id uuid, p_job_id uuid, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_number text;
begin
  if public.current_user_role() not in ('dispatcher','supervisor','admin','super_admin','finance') then raise exception 'forbidden'; end if;
  v_number := 'PO-' || to_char(now(),'YYYY') || '-' || lpad((floor(random()*999999)+1)::int::text,6,'0');
  insert into public.purchase_orders(po_number,vendor_id,job_id,notes,created_by) values(v_number,p_vendor_id,p_job_id,p_notes,auth.uid()) returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.create_purchase_order(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.create_purchase_order(uuid,uuid,text) to authenticated;
alter table public.materials enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.inventory_receipts enable row level security;
alter table public.inventory_receipt_items enable row level security;
alter table public.inventory_transactions enable row level security;
revoke all on table public.materials, public.purchase_orders, public.purchase_order_items, public.inventory_receipts, public.inventory_receipt_items, public.inventory_transactions from anon;
grant select on public.materials to authenticated;
grant select on public.purchase_orders, public.purchase_order_items, public.inventory_receipts, public.inventory_receipt_items, public.inventory_transactions to authenticated;
drop policy if exists materials_staff_select on public.materials;
create policy materials_staff_select on public.materials for select to authenticated using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin','finance','technician'));
drop policy if exists purchase_orders_staff_select on public.purchase_orders;
create policy purchase_orders_staff_select on public.purchase_orders for select to authenticated using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin','finance'));
drop policy if exists purchase_order_items_staff_select on public.purchase_order_items;
create policy purchase_order_items_staff_select on public.purchase_order_items for select to authenticated using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin','finance'));
drop policy if exists inventory_receipts_staff_select on public.inventory_receipts;
create policy inventory_receipts_staff_select on public.inventory_receipts for select to authenticated using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin','finance'));
drop policy if exists inventory_receipt_items_staff_select on public.inventory_receipt_items;
create policy inventory_receipt_items_staff_select on public.inventory_receipt_items for select to authenticated using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin','finance'));
drop policy if exists inventory_transactions_staff_select on public.inventory_transactions;
create policy inventory_transactions_staff_select on public.inventory_transactions for select to authenticated using (public.current_user_role() in ('dispatcher','supervisor','admin','super_admin','finance','technician'));
create or replace view public.material_inventory_summary with (security_invoker=true) as
select m.id,m.sku,m.name,m.unit,m.reorder_point,m.active,
       coalesce(sum(it.quantity),0) as on_hand,
       coalesce(sum(it.quantity),0) <= m.reorder_point as needs_reorder
from public.materials m left join public.inventory_transactions it on it.material_id=m.id
group by m.id;
