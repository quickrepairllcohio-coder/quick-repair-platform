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
alter table public.ledger_entries add column if not exists source_type text;
alter table public.ledger_entries add column if not exists source_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ledger_entries_source_unique') then
    execute 'alter table public.ledger_entries add constraint ledger_entries_source_unique unique(source_type, source_id)';
  end if;
exception when others then null; end $$;
