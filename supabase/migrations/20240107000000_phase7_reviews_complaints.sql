-- ۱. پاکسازی جداول قدیمی
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TYPE IF EXISTS public.complaint_status CASCADE;

-- ۲. مقادیر ENUM برای وضعیت شکایات
CREATE TYPE public.complaint_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

-- ۳. جدول نظرات و امتیازدهی (Reviews)
CREATE TABLE public.reviews (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
customer_id UUID NOT NULL REFERENCES public.profiles(id),
technician_id UUID NOT NULL REFERENCES public.profiles(id),
rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
comment TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۴. جدول شکایات و پیگیری‌ها (Complaints)
CREATE TABLE public.complaints (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
customer_id UUID NOT NULL REFERENCES public.profiles(id),
status public.complaint_status NOT NULL DEFAULT 'OPEN',
description TEXT NOT NULL,
resolution_notes TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۵. فعال‌سازی RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- ۶. سیاست‌های امنیتی نظرات
CREATE POLICY "Customers_Create_Own_Reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers_View_Own_Reviews" ON public.reviews FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Technicians_View_Own_Reviews" ON public.reviews FOR SELECT USING (auth.uid() = technician_id);
CREATE POLICY "Staff_Manage_All_Reviews" ON public.reviews FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER'));

-- ۷. سیاست‌های امنیتی شکایات
CREATE POLICY "Customers_Create_Own_Complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers_View_Own_Complaints" ON public.complaints FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Staff_Manage_All_Complaints" ON public.complaints FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'));