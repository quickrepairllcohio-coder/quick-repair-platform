-- Create the public profile automatically after Supabase Auth creates a user.
-- The role is intentionally forced to customer; privileged roles are provisioned server-side.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, phone, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    'customer'
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = excluded.phone,
    first_name = coalesce(excluded.first_name, public.users.first_name),
    last_name = coalesce(excluded.last_name, public.users.last_name),
    updated_at = now();
  insert into public.customers (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
create policy "customers read own addresses" on public.addresses
for select to authenticated
using (id in (
  select p.address_id from public.properties p
  join public.customers c on c.id = p.customer_id
  where c.user_id = auth.uid()
));
create policy "customers create own addresses" on public.addresses
for insert to authenticated
with check (true);
create policy "customers update own addresses" on public.addresses
for update to authenticated
using (id in (
  select p.address_id from public.properties p
  join public.customers c on c.id = p.customer_id
  where c.user_id = auth.uid()
));
