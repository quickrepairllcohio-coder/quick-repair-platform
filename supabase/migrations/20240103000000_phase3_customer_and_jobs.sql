-- ۱. پاکسازی جداول قدیمی (برای جلوگیری از تداخل)
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.customer_properties CASCADE;
DROP TYPE IF EXISTS public.property_type CASCADE;
DROP TYPE IF EXISTS public.request_urgency CASCADE;
DROP TYPE IF EXISTS public.request_status CASCADE;

-- ۲. مقادیر ENUM برای املاک و درخواست‌ها
CREATE TYPE public.property_type AS ENUM ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL');
CREATE TYPE public.request_urgency AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');
CREATE TYPE public.request_status AS ENUM ('PENDING', 'REVIEWING', 'ESTIMATE_PREPARATION', 'CONVERTED_TO_JOB', 'CANCELLED', 'REJECTED');

-- ۳. جدول املاک مشتریان (Customer Properties)
CREATE TABLE public.customer_properties (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
property_type public.property_type NOT NULL DEFAULT 'RESIDENTIAL',
address TEXT NOT NULL,
city TEXT,
zip_code TEXT,
access_instructions TEXT,
property_notes TEXT,
is_primary BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۴. جدول درخواست‌های خدمات (Service Requests)
CREATE TABLE public.service_requests (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
property_id UUID REFERENCES public.customer_properties(id) ON DELETE SET NULL,
service_category TEXT NOT NULL,
urgency public.request_urgency NOT NULL DEFAULT 'NORMAL',
description TEXT NOT NULL,
preferred_date DATE,
photos TEXT[],
status public.request_status NOT NULL DEFAULT 'PENDING',
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۵. جدول کارهای اجرایی نهایی (Jobs)
CREATE TABLE public.jobs (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
property_id UUID REFERENCES public.customer_properties(id) ON DELETE SET NULL,
status TEXT NOT NULL DEFAULT 'PENDING',
title TEXT NOT NULL,
description TEXT,
scheduled_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۶. فعال‌سازی RLS
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- ۷. سیاست‌های امنیتی
CREATE POLICY "Customers_Manage_Own_Properties" ON public.customer_properties FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Staff_Manage_All_Properties" ON public.customer_properties FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'));
CREATE POLICY "Technicians_Read_Assigned_Properties" ON public.customer_properties FOR SELECT USING (id IN (SELECT property_id FROM public.jobs WHERE technician_id = auth.uid()));

CREATE POLICY "Customers_Manage_Own_Requests" ON public.service_requests FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Staff_Manage_All_Requests" ON public.service_requests FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'));

CREATE POLICY "Customers_View_Own_Jobs" ON public.jobs FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Technicians_View_Assigned_Jobs" ON public.jobs FOR SELECT USING (auth.uid() = technician_id);
CREATE POLICY "Staff_Manage_All_Jobs" ON public.jobs FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'MANAGER'));