create extension if not exists pgcrypto;
create type public.user_role as enum ('customer','technician','dispatcher','supervisor','estimator','finance','admin','super_admin');
create type public.user_status as enum ('active','inactive','suspended');
create type public.pricing_mode as enum ('fixed','starting_at','inspection','custom');
create type public.urgency_level as enum ('emergency','urgent','normal','scheduled');
create type public.request_status as enum ('draft','submitted','triage','reviewing','estimate_required','estimate_sent','customer_approved','scheduled','dispatched','in_progress','completed','closed','cancelled');
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  first_name text,
  last_name text,
  role public.user_role not null default 'customer',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  preferred_language text not null default 'en',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null default 'US',
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz not null default now()
);
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  address_id uuid not null references public.addresses(id),
  property_type text,
  ownership_type text,
  year_built integer,
  square_feet integer,
  bedrooms integer,
  bathrooms numeric(4,1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id),
  name text not null,
  slug text not null unique,
  description text,
  pricing_mode public.pricing_mode not null default 'inspection',
  requires_inspection boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  customer_id uuid not null references public.customers(id),
  property_id uuid not null references public.properties(id),
  category_id uuid references public.service_categories(id),
  service_type_id uuid references public.service_types(id),
  title text,
  description text,
  urgency public.urgency_level not null default 'normal',
  status public.request_status not null default 'draft',
  is_emergency boolean not null default false,
  budget_min numeric(12,2),
  budget_max numeric(12,2),
  preferred_date date,
  preferred_time_from time,
  preferred_time_to time,
  insurance_claim boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  media_type text not null check (media_type in ('photo','video','audio','document')),
  storage_path text not null,
  file_name text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create table public.technicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  employment_type text,
  status text not null default 'offline',
  rating numeric(3,2),
  completed_jobs integer not null default 0,
  service_radius_miles numeric(6,2),
  background_status text,
  insurance_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique,
  request_id uuid not null unique references public.service_requests(id),
  estimate_id uuid,
  customer_id uuid not null references public.customers(id),
  property_id uuid not null references public.properties(id),
  assigned_technician_id uuid references public.technicians(id),
  status text not null default 'scheduled',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  check_in_at timestamptz,
  check_out_at timestamptz,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.dispatches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  technician_id uuid not null references public.technicians(id),
  status text not null default 'offered',
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  distance_miles numeric(8,2),
  created_at timestamptz not null default now()
);
create table public.technician_locations (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  accuracy numeric(8,2),
  speed numeric(8,2),
  heading numeric(8,2),
  recorded_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.properties enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_types enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_media enable row level security;
alter table public.technicians enable row level security;
alter table public.jobs enable row level security;
alter table public.dispatches enable row level security;
alter table public.technician_locations enable row level security;
alter table public.audit_logs enable row level security;
create policy "users read own profile" on public.users for select to authenticated using (id = auth.uid());
create policy "customers read own record" on public.customers for select to authenticated using (user_id = auth.uid());
create policy "customers manage own properties" on public.properties for all to authenticated using (customer_id in (select c.id from public.customers c where c.user_id = auth.uid())) with check (customer_id in (select c.id from public.customers c where c.user_id = auth.uid()));
create policy "customers read service catalog" on public.service_categories for select to authenticated using (active = true);
create policy "customers read service types" on public.service_types for select to authenticated using (active = true);
create policy "customers manage own requests" on public.service_requests for all to authenticated using (customer_id in (select c.id from public.customers c where c.user_id = auth.uid())) with check (customer_id in (select c.id from public.customers c where c.user_id = auth.uid()));
create policy "customers manage own request media" on public.request_media for all to authenticated using (request_id in (select r.id from public.service_requests r join public.customers c on c.id=r.customer_id where c.user_id=auth.uid())) with check (request_id in (select r.id from public.service_requests r join public.customers c on c.id=r.customer_id where c.user_id=auth.uid()));
insert into public.service_categories (name,slug,description,sort_order) values
('Plumbing','plumbing','Water, drains, leaks, sewer and fixtures',1),
('Electrical','electrical','Electrical repairs and installations',2),
('HVAC','hvac','Heating, cooling and ventilation',3),
('Roofing & Gutters','roofing-gutters','Roof, gutter and exterior water protection',4),
('Drywall & Paint','drywall-paint','Walls, ceilings, drywall and painting',5),
('Flooring','flooring','Floor installation and repair',6),
('Doors & Windows','doors-windows','Doors, windows, locks and related repairs',7),
('Handyman','handyman','General home repairs',8),
('Appliance','appliance','Appliance repair and installation',9),
('Junk & Dumpster','junk-dumpster','Junk removal and dumpster services',10);
