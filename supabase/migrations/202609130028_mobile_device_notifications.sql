-- v3.8 mobile device registration + push delivery foundation
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'expo' check (provider in ('expo','fcm','apns')),
  push_token text not null,
  platform text not null check (platform in ('ios','android','web')),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, push_token)
);
create index if not exists user_devices_user_enabled_idx
  on public.user_devices(user_id, enabled);
alter table public.user_devices enable row level security;
create policy "users_manage_own_devices"
  on public.user_devices for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create or replace function public.register_user_device(
  p_provider text,
  p_push_token text,
  p_platform text
) returns public.user_devices
language plpgsql security definer set search_path = ''
as $$
declare result public.user_devices;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_provider not in ('expo','fcm','apns') then raise exception 'Unsupported push provider'; end if;
  if p_platform not in ('ios','android','web') then raise exception 'Unsupported platform'; end if;
  if length(trim(p_push_token)) < 10 then raise exception 'Invalid push token'; end if;
  insert into public.user_devices(user_id,provider,push_token,platform,enabled,last_seen_at,updated_at)
  values(auth.uid(),p_provider,trim(p_push_token),p_platform,true,now(),now())
  on conflict(user_id,push_token) do update set
    provider=excluded.provider, platform=excluded.platform, enabled=true,
    last_seen_at=now(), updated_at=now()
  returning * into result;
  return result;
end;
$$;
revoke all on function public.register_user_device(text,text,text) from public;
grant execute on function public.register_user_device(text,text,text) to authenticated;
