-- Quick Repair v1.6: production hardening
-- Goals: safer RPC execution, request throttling, stronger media metadata rules,
-- and operational health helpers. Review with legal/security before production.
create extension if not exists pgcrypto;
-- Generic per-user operation rate limiter. This is intentionally conservative and
-- should be supplemented with edge/WAF limits in production.
create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_rate_limit_events_user_action_time
  on public.rate_limit_events(user_id, action, occurred_at desc);
alter table public.rate_limit_events enable row level security;
revoke all on public.rate_limit_events from anon, authenticated;
grant select on public.rate_limit_events to authenticated;
create or replace function public.check_rate_limit(
  p_action text,
  p_max_events integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then
    return false;
  end if;
  if p_max_events < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;
  delete from public.rate_limit_events
   where occurred_at < now() - make_interval(secs => p_window_seconds * 2);
  select count(*) into n
    from public.rate_limit_events
   where user_id = uid
     and action = p_action
     and occurred_at >= now() - make_interval(secs => p_window_seconds);
  if n >= p_max_events then
    return false;
  end if;
  insert into public.rate_limit_events(user_id, action)
  values(uid, p_action);
  return true;
end;
$$;
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
-- Media metadata guard. Keep the database as a second line of defense;
-- bucket/file-size/MIME enforcement should also be configured in Storage.
create or replace function public.validate_request_media_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.storage_path is null or length(trim(new.storage_path)) = 0 then
    raise exception 'file_path is required';
  end if;
  if length(new.storage_path) > 1000 then
    raise exception 'file_path is too long';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_validate_request_media_metadata on public.request_media;
create trigger trg_validate_request_media_metadata
before insert or update on public.request_media
for each row execute function public.validate_request_media_metadata();
-- Operational health snapshot for admins. Does not expose customer message content.
create or replace function public.production_health_snapshot()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'checked_at', now(),
    'open_requests', (select count(*) from public.service_requests where status = 'submitted'),
    'active_jobs', (select count(*) from public.jobs where status in ('dispatched','en_route','arrived','in_progress')),
    'unpaid_invoices', (select count(*) from public.invoices where status in ('open','past_due')),
    'failed_payments_24h', (select count(*) from public.payments where status = 'failed' and created_at >= now() - interval '24 hours')
  );
$$;
revoke all on function public.production_health_snapshot() from public;
grant execute on function public.production_health_snapshot() to authenticated;
comment on function public.production_health_snapshot() is 'Admin health snapshot; production access should be restricted by role in a wrapper/RPC policy.';
