create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_created_idx on public.audit_events(created_at desc);
create index if not exists audit_events_entity_idx on public.audit_events(entity_type, entity_id);
alter table public.audit_events enable row level security;
create or replace function public.operations_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb;
begin
  if public.current_user_role() not in ('dispatcher','supervisor','admin','super_admin') then
    raise exception 'forbidden';
  end if;
  select jsonb_build_object(
    'open_requests', (select count(*) from service_requests where status in ('submitted','triaged','scheduled')),
    'active_jobs', (select count(*) from jobs where status in ('dispatched','en_route','arrived','in_progress')),
    'completed_today', (select count(*) from jobs where status='completed' and check_out_at >= current_date),
    'open_invoices', (select count(*) from invoices where status in ('open','past_due')),
    'paid_today', coalesce((select sum(amount) from payments where status='succeeded' and created_at >= current_date),0),
    'emergency_requests', (select count(*) from service_requests where urgency='emergency' and status not in ('completed','cancelled'))
  ) into r;
  return r;
end;
$$;
grant execute on function public.operations_dashboard() to authenticated;
create or replace function public.admin_set_technician_status(p_technician_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() not in ('dispatcher','supervisor','admin','super_admin') then raise exception 'forbidden'; end if;
  if p_status not in ('available','busy','offline','on_leave') then raise exception 'invalid status'; end if;
  update technicians set status=p_status, updated_at=now() where id=p_technician_id;
  if not found then raise exception 'technician not found'; end if;
end;
$$;
grant execute on function public.admin_set_technician_status(uuid,text) to authenticated;
