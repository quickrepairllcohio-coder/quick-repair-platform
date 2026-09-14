create extension if not exists pgcrypto;
-- Revenue, accounting, subscriptions, tips, CRM, offline sync and operational forecasting.
create type public.ledger_account_type as enum ('asset','liability','equity','revenue','expense');
create type public.ledger_entry_status as enum ('posted','voided');
create type public.subscription_status as enum ('trialing','active','past_due','paused','canceled','incomplete');
create type public.campaign_channel as enum ('sms','email','push');
create type public.campaign_status as enum ('draft','scheduled','sending','sent','paused','canceled');
create type public.sync_operation_status as enum ('pending','processing','synced','failed');
do $$ begin
  create table public.ledger_accounts (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    name text not null,
    account_type public.ledger_account_type not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
  );
exception when duplicate_table then null; end $$;
do $$ begin
  create table public.ledger_entries (
    id uuid primary key default gen_random_uuid(),
    entry_number text unique not null,
    job_id uuid references public.jobs(id) on delete set null,
    source_type text not null,
    source_id uuid,
    description text not null,
    status public.ledger_entry_status not null default 'posted',
    posted_at timestamptz not null default now(),
    created_by uuid references public.users(id)
  );
exception when duplicate_table then null; end $$;
do $$ begin
  create table public.ledger_lines (
    id uuid primary key default gen_random_uuid(),
    entry_id uuid not null references public.ledger_entries(id) on delete cascade,
    account_id uuid not null references public.ledger_accounts(id),
    debit numeric(14,2) not null default 0 check (debit >= 0),
    credit numeric(14,2) not null default 0 check (credit >= 0),
    description text,
    check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
  );
exception when duplicate_table then null; end $$;
create or replace function public.post_balanced_ledger_entry(
  p_source_type text, p_source_id uuid,  p_description text,
  p_lines jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_entry uuid; v_total_debit numeric(14,2); v_total_credit numeric(14,2); 
begin
  if public.current_user_role() not in ('finance','admin','super_admin') then raise exception 'Not authorized'; end if;
  select coalesce(sum((x->>'debit')::numeric),0), coalesce(sum((x->>'credit')::numeric),0)
    into v_total_debit, v_total_credit from jsonb_array_elements(p_lines) x;
  if v_total_debit <= 0 or v_total_debit <> v_total_credit then raise exception 'Ledger entry must balance'; end if;
  insert into ledger_entries(source_type,source_id,description,created_by)
  values(p_source_type,p_source_id,p_description,(select id from users where id=auth.uid())) returning id into v_entry;
  insert into ledger_lines(entry_id,account_id,debit,credit,description)
  select v_entry,(x->>'account_id')::uuid,coalesce((x->>'debit')::numeric,0),coalesce((x->>'credit')::numeric,0),x->>'description'
  from jsonb_array_elements(p_lines) x;
  return v_entry;
end $$;
insert into public.ledger_accounts(code,name,account_type) values
('1000','Operating Cash','asset'),('1100','Accounts Receivable','asset'),('1200','Inventory','asset'),
('2000','Accounts Payable','liability'),('2100','Customer Deposits','liability'),
('3000','Owner Equity','equity'),('4000','Service Revenue','revenue'),('4100','Emergency Service Revenue','revenue'),
('5000','Materials Expense','expense'),('5100','Labor Expense','expense'),('5200','Marketing Expense','expense'),('5300','Vehicle/Travel Expense','expense'),('5400','Platform/Processing Fees','expense')
on conflict (code) do nothing;
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(), name text unique not null, description text,
  stripe_price_id text unique, amount numeric(12,2) not null check(amount>=0), currency text not null default 'usd',
  interval text not null check(interval in ('month','year')), active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id), stripe_customer_id text, stripe_subscription_id text unique,
  status public.subscription_status not null default 'incomplete', current_period_start timestamptz, current_period_end timestamptz,
  canceled_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict, technician_id uuid references public.technicians(id) on delete set null,
  amount numeric(12,2) not null check(amount>0), currency text not null default 'usd', provider_payment_id text unique,
  status public.payment_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(), customer_id uuid unique references public.customers(id) on delete cascade,
  lifecycle_stage text not null default 'customer', last_contacted_at timestamptz, next_follow_up_at timestamptz,
  tags text[] not null default '{}', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(), name text not null, channel public.campaign_channel not null,
  status public.campaign_status not null default 'draft', subject text, body text not null, scheduled_at timestamptz,
  sent_at timestamptz, created_by uuid references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.marketing_campaign_recipients (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade, status text not null default 'queued',
  provider_message_id text, sent_at timestamptz, error_message text, unique(campaign_id,customer_id)
);
create table if not exists public.offline_sync_queue (
  id uuid primary key default gen_random_uuid(), technician_id uuid not null references public.technicians(id) on delete cascade,
  device_id text not null, operation text not null, entity_type text not null, entity_id uuid, payload jsonb not null default '{}',
  client_created_at timestamptz not null, status public.sync_operation_status not null default 'pending', attempts int not null default 0,
  last_error text, synced_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists offline_sync_pending_idx on public.offline_sync_queue(technician_id,status,created_at);
create table if not exists public.ai_triage_results (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.service_requests(id) on delete cascade,
  model text not null, summary text, recommended_service_type_id uuid references public.service_types(id), urgency public.urgency_level,
  safety_flags jsonb not null default '[]', suggested_questions jsonb not null default '[]', confidence numeric(5,4), created_at timestamptz not null default now()
);
create table if not exists public.price_rules (
  id uuid primary key default gen_random_uuid(), name text not null, service_type_id uuid references public.service_types(id) on delete cascade,
  urgency public.urgency_level, multiplier numeric(8,4) not null default 1 check(multiplier>0), active boolean not null default true,
  start_at timestamptz, end_at timestamptz, priority int not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.inventory_forecasts (
  id uuid primary key default gen_random_uuid(), material_id uuid not null references public.materials(id) on delete cascade,
  forecast_date date not null, projected_on_hand numeric(14,2) not null, projected_daily_usage numeric(14,4) not null,
  reorder_recommended boolean not null default false, created_at timestamptz not null default now(), unique(material_id,forecast_date)
);
create or replace function public.calculate_price_multiplier(p_service_type_id uuid,p_urgency public.urgency_level,p_at timestamptz default now())
returns numeric language sql stable security definer set search_path=public as $$
  select coalesce((select multiplier from price_rules where active and (service_type_id is null or service_type_id=p_service_type_id)
    and (urgency is null or urgency=p_urgency) and (start_at is null or start_at<=p_at) and (end_at is null or end_at>=p_at)
    order by priority desc limit 1),1)::numeric;
$$;
alter table public.ledger_accounts enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.ledger_lines enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.customer_subscriptions enable row level security;
alter table public.tips enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_campaign_recipients enable row level security;
alter table public.offline_sync_queue enable row level security;
alter table public.ai_triage_results enable row level security;
alter table public.price_rules enable row level security;
alter table public.inventory_forecasts enable row level security;
create policy ledger_finance_select on public.ledger_entries for select using(public.current_user_role() in ('finance','admin','super_admin'));
create policy ledger_lines_finance_select on public.ledger_lines for select using(entry_id in(select id from ledger_entries where public.current_user_role() in ('finance','admin','super_admin')));
create policy ledger_accounts_finance_select on public.ledger_accounts for select using(public.current_user_role() in ('finance','admin','super_admin'));
create policy subscription_plans_public_select on public.subscription_plans for select to authenticated using(active=true or public.current_user_role() in ('admin','super_admin'));
create policy subscriptions_customer_select on public.customer_subscriptions for select using(customer_id=(select id from customers where user_id=auth.uid()) or public.current_user_role() in ('finance','admin','super_admin'));
create policy tips_customer_select on public.tips for select using(customer_id=(select id from customers where user_id=auth.uid()) or public.current_user_role() in ('technician','dispatcher','supervisor','admin','super_admin'));
create policy crm_staff_all on public.crm_contacts for all using(public.current_user_role() in ('dispatcher','supervisor','estimator','finance','admin','super_admin')) with check(public.current_user_role() in ('dispatcher','supervisor','estimator','finance','admin','super_admin'));
create policy campaign_staff_all on public.marketing_campaigns for all using(public.current_user_role() in ('admin','super_admin')) with check(public.current_user_role() in ('admin','super_admin'));
create policy campaign_recipients_staff on public.marketing_campaign_recipients for all using(public.current_user_role() in ('admin','super_admin')) with check(public.current_user_role() in ('admin','super_admin'));
create policy offline_sync_technician on public.offline_sync_queue for all using(technician_id=(select id from technicians where user_id=auth.uid()) or public.current_user_role() in ('dispatcher','supervisor','admin','super_admin')) with check(technician_id=(select id from technicians where user_id=auth.uid()) or public.current_user_role() in ('dispatcher','supervisor','admin','super_admin'));
create policy ai_triage_staff on public.ai_triage_results for select using(public.current_user_role() in ('dispatcher','supervisor','estimator','admin','super_admin'));
create policy price_rules_staff on public.price_rules for all using(public.current_user_role() in ('estimator','finance','admin','super_admin')) with check(public.current_user_role() in ('estimator','finance','admin','super_admin'));
create policy inventory_forecast_staff on public.inventory_forecasts for select using(public.current_user_role() in ('finance','dispatcher','supervisor','admin','super_admin'));
grant execute on function public.post_balanced_ledger_entry(text, uuid, text, jsonb) to authenticated;
grant execute on function public.calculate_price_multiplier(uuid,public.urgency_level,timestamptz) to authenticated;
