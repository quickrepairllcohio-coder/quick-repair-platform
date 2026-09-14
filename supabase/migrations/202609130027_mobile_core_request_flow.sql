-- v3.7 Mobile Core Request Flow
-- Secure RPCs used by the customer mobile request wizard.
create sequence if not exists public.request_number_seq;
create or replace function public.make_request_number()
returns text
language sql
security definer
set search_path = public
as $$ select 'RQ-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.request_number_seq')::text,6,'0')::text $$;
grant execute on function public.make_request_number() to authenticated;
revoke all on function public.make_request_number() from public;
create or replace function public.create_property(
  p_address_line1 text,
  p_address_line2 text default null,
  p_city text default null,
  p_state text default null,
  p_zip_code text default null,
  p_property_type text default 'single_family',
  p_ownership_type text default 'owner'
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_address_id uuid;
  v_property_id uuid;
begin
  select id into v_customer_id from public.customers where user_id = auth.uid();
  if v_customer_id is null then raise exception 'Customer profile not found'; end if;
  if coalesce(trim(p_address_line1),'') = '' or coalesce(trim(p_city),'') = '' or coalesce(trim(p_state),'') = '' or coalesce(trim(p_zip_code),'') = '' then
    raise exception 'Complete property address is required';
  end if;
  insert into public.addresses(address_line1,address_line2,city,state,zip_code)
  values(trim(p_address_line1),nullif(trim(p_address_line2),''),trim(p_city),trim(p_state),trim(p_zip_code))
  returning id into v_address_id;
  insert into public.properties(customer_id,address_id,property_type,ownership_type)
  values(v_customer_id,v_address_id,coalesce(nullif(trim(p_property_type),''),'single_family'),coalesce(nullif(trim(p_ownership_type),''),'owner'))
  returning id into v_property_id;
  return v_property_id;
end $$;
grant execute on function public.create_property(text,text,text,text,text,text,text) to authenticated;
revoke all on function public.create_property(text,text,text,text,text,text,text) from public;
create or replace function public.create_service_request(
  p_property_id uuid,
  p_category_id uuid,
  p_service_type_id uuid default null,
  p_title text default null,
  p_description text default null,
  p_urgency public.urgency_level default 'normal',
  p_is_emergency boolean default false,
  p_budget_min numeric default null,
  p_budget_max numeric default null,
  p_preferred_date date default null,
  p_preferred_time_from time default null,
  p_preferred_time_to time default null,
  p_insurance_claim boolean default false
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_request_id uuid;
  v_request_number text;
begin
  select id into v_customer_id from public.customers where user_id = auth.uid();
  if v_customer_id is null then raise exception 'Customer profile not found'; end if;
  if not exists (select 1 from public.properties where id=p_property_id and customer_id=v_customer_id) then raise exception 'Property is not accessible'; end if;
  if not exists (select 1 from public.service_categories where id=p_category_id and active=true) then raise exception 'Service category is not available'; end if;
  if p_service_type_id is not null and not exists (select 1 from public.service_types where id=p_service_type_id and category_id=p_category_id and active=true) then raise exception 'Service type is not available'; end if;
  if p_budget_min is not null and p_budget_max is not null and p_budget_max < p_budget_min then raise exception 'Maximum budget cannot be below minimum budget'; end if;
  if p_is_emergency then p_urgency := 'emergency'; end if;
  v_request_number := public.make_request_number();
  insert into public.service_requests(request_number,customer_id,property_id,category_id,service_type_id,title,description,urgency,status,is_emergency,budget_min,budget_max,preferred_date,preferred_time_from,preferred_time_to,insurance_claim)
  values(v_request_number,v_customer_id,p_property_id,p_category_id,p_service_type_id,nullif(trim(p_title),''),nullif(trim(p_description),''),p_urgency,'submitted',p_is_emergency,p_budget_min,p_budget_max,p_preferred_date,p_preferred_time_from,p_preferred_time_to,coalesce(p_insurance_claim,false))
  returning id into v_request_id;
  return v_request_id;
end $$;
grant execute on function public.create_service_request(uuid,uuid,uuid,text,text,public.urgency_level,boolean,numeric,numeric,date,time,time,boolean) to authenticated;
revoke all on function public.create_service_request(uuid,uuid,uuid,text,text,public.urgency_level,boolean,numeric,numeric,date,time,time,boolean) from public;
