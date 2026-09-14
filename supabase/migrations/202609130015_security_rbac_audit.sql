-- v1.5 Security / RBAC / Audit hardening
create schema if not exists private;
create table if not exists public.permissions (
  key text primary key,
  description text not null
);
create table if not exists public.role_permissions (
  role public.user_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role, permission_key)
);
create index if not exists role_permissions_key_idx on public.role_permissions(permission_key);
insert into public.permissions(key, description) values
 ('admin.dashboard.view','View operations dashboard'),
 ('requests.view','View service requests'),
 ('requests.manage','Manage service requests'),
 ('dispatch.manage','Assign and manage dispatches'),
 ('technicians.view','View technicians'),
 ('technicians.manage','Manage technicians'),
 ('payments.view','View payments'),
 ('payments.manage','Manage payments'),
 ('estimates.manage','Manage estimates'),
 ('invoices.manage','Manage invoices'),
 ('audit.view','View audit events'),
 ('users.manage','Manage staff users')
on conflict (key) do nothing;
insert into public.role_permissions(role, permission_key)
select r.role, p.key
from (values
 ('dispatcher'::public.user_role),('supervisor'::public.user_role),('admin'::public.user_role),('super_admin'::public.user_role)
) r(role)
cross join public.permissions p
where r.role in ('dispatcher','supervisor','admin','super_admin')
and p.key in ('admin.dashboard.view','requests.view','requests.manage','dispatch.manage','technicians.view','technicians.manage')
on conflict do nothing;
insert into public.role_permissions(role, permission_key)
select r.role, p.key
from (values ('finance'::public.user_role),('admin'::public.user_role),('super_admin'::public.user_role)) r(role)
cross join public.permissions p
where p.key in ('payments.view','payments.manage','invoices.manage','estimates.manage')
on conflict do nothing;
insert into public.role_permissions(role, permission_key)
select r.role, p.key
from (values ('admin'::public.user_role),('super_admin'::public.user_role)) r(role)
cross join public.permissions p
where p.key in ('audit.view','users.manage')
on conflict do nothing;
create or replace function private.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    join public.role_permissions rp on rp.role = u.role
    where u.id = (select auth.uid())
      and u.status = 'active'
      and rp.permission_key = p_permission
  );
$$;
revoke all on function private.has_permission(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_permission(text) to authenticated;
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select u.role from public.users u where u.id = (select auth.uid());
$$;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hint text,
  created_at timestamptz not null default now()
);
create index if not exists security_audit_log_created_idx on public.security_audit_log(created_at desc);
create index if not exists security_audit_log_actor_idx on public.security_audit_log(actor_user_id, created_at desc);
alter table public.security_audit_log enable row level security;
create policy "security audit admin read" on public.security_audit_log
for select to authenticated
using ((select private.has_permission('audit.view')));
create or replace function public.record_security_audit(
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  insert into public.security_audit_log(actor_user_id, action, entity_type, entity_id, metadata)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.record_security_audit(text,text,uuid,jsonb) from public;
grant execute on function public.record_security_audit(text,text,uuid,jsonb) to authenticated;
create or replace function public.admin_me()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  select jsonb_build_object('id',u.id,'email',u.email,'first_name',u.first_name,'last_name',u.last_name,'role',u.role,'status',u.status)
  into r from public.users u where u.id=(select auth.uid());
  if r is null then raise exception 'profile not found'; end if;
  return r;
end;
$$;
revoke all on function public.admin_me() from public;
grant execute on function public.admin_me() to authenticated;
-- Staff provisioning is server/admin only. Existing customer self-signup remains customer-only.
create or replace function public.set_staff_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.has_permission('users.manage')) then raise exception 'forbidden'; end if;
  if p_role = 'customer' then raise exception 'use customer onboarding for customer role'; end if;
  update public.users set role=p_role, updated_at=now() where id=p_user_id;
  if not found then raise exception 'user not found'; end if;
  perform public.record_security_audit('STAFF_ROLE_CHANGED','user',p_user_id,jsonb_build_object('role',p_role));
end;
$$;
revoke all on function public.set_staff_role(uuid,public.user_role) from public;
grant execute on function public.set_staff_role(uuid,public.user_role) to authenticated;
-- Secure admin dashboard RPC with permission check.
create or replace function public.operations_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare r jsonb;
begin
  if not (select private.has_permission('admin.dashboard.view')) then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'open_requests', (select count(*) from public.service_requests where status in ('submitted','triage','reviewing','estimate_required')),
    'active_jobs', (select count(*) from public.jobs where status in ('dispatched','en_route','arrived','in_progress')),
    'completed_today', (select count(*) from public.jobs where status='completed' and check_out_at >= current_date),
    'open_invoices', (select count(*) from public.invoices where status in ('open','past_due')),
    'paid_today', coalesce((select sum(amount) from public.payments where status='succeeded' and created_at >= current_date),0),
    'emergency_requests', (select count(*) from public.service_requests where urgency='emergency' and status not in ('completed','cancelled'))
  ) into r;
  return r;
end;
$$;
revoke all on function public.operations_dashboard() from public;
grant execute on function public.operations_dashboard() to authenticated;
-- Add audit trigger to staff profile changes.
create or replace function private.audit_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role is distinct from new.role then
    insert into public.security_audit_log(actor_user_id, action, entity_type, entity_id, metadata)
    values ((select auth.uid()), 'STAFF_ROLE_CHANGED','user',new.id,jsonb_build_object('old_role',old.role,'new_role',new.role));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_audit_user_role_change on public.users;
create trigger trg_audit_user_role_change
after update of role on public.users
for each row execute function private.audit_user_role_change();
