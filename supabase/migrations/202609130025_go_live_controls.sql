-- v3.2 Go-Live Controls: idempotency, consent, offline sync, ledger source integrity.
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);
alter table public.payment_events enable row level security;
drop policy if exists payment_events_finance_select on public.payment_events; create policy payment_events_finance_select on public.payment_events for select using(public.current_user_role() in ('finance','admin','super_admin'));
alter table public.ledger_entries add column if not exists source_type text; alter table public.ledger_entries add column if not exists source_id uuid; do $$ begin if not exists (select 1 from pg_constraint where conname = 'ledger_entries_source_unique') then execute 'alter table public.ledger_entries add constraint ledger_entries_source_unique unique(source_type, source_id)'; end if; exception when others then null; end $$;
create table if not exists public.customer_consents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  channel text not null check(channel in ('sms','email','push')),
  purpose text not null check(purpose in ('transactional','marketing')),
  granted boolean not null default false,
  source text not null default 'app',
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id,channel,purpose)
);
alter table public.customer_consents enable row level security;
create policy consent_customer_manage on public.customer_consents for all using(customer_id=(select id from public.customers where user_id=auth.uid())) with check(customer_id=(select id from public.customers where user_id=auth.uid()));
create policy consent_staff_select on public.customer_consents for select using(public.current_user_role() in ('dispatcher','supervisor','finance','admin','super_admin'));
create or replace function public.set_customer_consent(p_channel text,p_purpose text,p_granted boolean)
returns public.customer_consents language plpgsql security definer set search_path=public as $$
declare v public.customer_consents; c uuid;
begin
  select id into c from public.customers where user_id=auth.uid();
  if c is null then raise exception 'Customer not found'; end if;
  insert into public.customer_consents(customer_id,channel,purpose,granted,granted_at,revoked_at,updated_at)
  values(c,p_channel,p_purpose,p_granted,case when p_granted then now() else null end,case when not p_granted then now() else null end,now())
  on conflict(customer_id,channel,purpose) do update set granted=excluded.granted,granted_at=excluded.granted_at,revoked_at=excluded.revoked_at,updated_at=now()
  returning * into v;
  return v;
end $$;
grant execute on function public.set_customer_consent(text,text,boolean) to authenticated;
create or replace function public.enqueue_offline_operation(p_device_id text,p_operation text,p_entity_type text,p_entity_id uuid,p_payload jsonb,p_client_created_at timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$
declare t uuid; q uuid;
begin
  select id into t from public.technicians where user_id=auth.uid();
  if t is null then raise exception 'Technician not found'; end if;
  insert into public.offline_sync_queue(technician_id,device_id,operation,entity_type,entity_id,payload,client_created_at)
  values(t,p_device_id,p_operation,p_entity_type,p_entity_id,coalesce(p_payload,'{}'),p_client_created_at)
  returning id into q;
  return q;
end $$;
grant execute on function public.enqueue_offline_operation(text,text,text,uuid,jsonb,timestamptz) to authenticated;
create or replace function public.mark_offline_operation_synced(p_queue_id uuid)
returns public.offline_sync_queue language plpgsql security definer set search_path=public as $$
declare v public.offline_sync_queue; t uuid;
begin
  select id into t from public.technicians where user_id=auth.uid();
  update public.offline_sync_queue set status='synced',synced_at=now(),last_error=null
  where id=p_queue_id and (technician_id=t or public.current_user_role() in ('dispatcher','supervisor','admin','super_admin'))
  returning * into v;
  if v.id is null then raise exception 'Queue item not found or unauthorized'; end if;
  return v;
end $$;
grant execute on function public.mark_offline_operation_synced(uuid) to authenticated;
create or replace function public.record_payment_event(p_provider text,p_provider_event_id text,p_event_type text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  if public.current_user_role() not in ('finance','admin','super_admin') then raise exception 'Not authorized'; end if;
  insert into public.payment_events(provider,provider_event_id,event_type,payload)
  values(p_provider,p_provider_event_id,p_event_type,coalesce(p_payload,'{}'))
  on conflict(provider,provider_event_id) do update set event_type=excluded.event_type
  returning id into v;
  return v;
end $$;
grant execute on function public.record_payment_event(text,text,text,jsonb) to authenticated;
create or replace function public.production_go_live_gate()
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'rls_tables', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity),
    'payment_event_idempotency', exists(select 1 from pg_constraint where conname='payment_events_provider_provider_event_id_key'),
    'ledger_source_idempotency', exists(select 1 from pg_constraint where conname='ledger_entries_source_unique'),
    'offline_sync_rpc', exists(select 1 from pg_proc where proname='enqueue_offline_operation'),
    'consent_controls', exists(select 1 from pg_class where relname='customer_consents'),
    'generated_at', now()
  );
$$;
grant execute on function public.production_go_live_gate() to authenticated;
