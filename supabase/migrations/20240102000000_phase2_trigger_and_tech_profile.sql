-- ۱. پاکسازی نسخه‌های دستی احتمالی از قبل
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.technician_portfolio CASCADE;
DROP TABLE IF EXISTS public.technician_certifications CASCADE;
DROP TABLE IF EXISTS public.technician_skills CASCADE;
DROP TYPE IF EXISTS public.proficiency_level CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;
DROP TYPE IF EXISTS public.visibility_status CASCADE;

-- ۲. ایجاد تریگر ثبت‌نام ایمن
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
requested_role text;
assigned_role public.user_role;
BEGIN
requested_role := new.raw_user_meta_data->>'role';
IF requested_role = 'technician' THEN
assigned_role := 'TECHNICIAN';
ELSE
assigned_role := 'CUSTOMER';
END IF;

INSERT INTO public.profiles (id, role, first_name, last_name, is_active)
VALUES (
new.id,
assigned_role,
new.raw_user_meta_data->>'full_name',
NULL,
true
);
RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ۳. ایجاد مقادیر ENUM برای تکنسین
CREATE TYPE public.proficiency_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT', 'MASTER');
CREATE TYPE public.verification_status AS ENUM ('PENDING', 'VERIFIED', 'EXPIRING_SOON', 'EXPIRED', 'REJECTED');
CREATE TYPE public.visibility_status AS ENUM ('PUBLIC', 'PRIVATE');

-- ۴. جداول مهارت‌ها، گواهینامه‌ها و نمونه‌کارها
CREATE TABLE public.technician_skills (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
skill_name TEXT NOT NULL,
proficiency public.proficiency_level NOT NULL DEFAULT 'INTERMEDIATE',
years_experience INTEGER CHECK (years_experience >= 0),
is_verified BOOLEAN DEFAULT false,
verified_by UUID REFERENCES public.profiles(id),
verified_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.technician_certifications (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
certificate_name TEXT NOT NULL,
issuing_organization TEXT NOT NULL,
certificate_number TEXT,
issue_date DATE,
expiration_date DATE,
document_path TEXT,
status public.verification_status NOT NULL DEFAULT 'PENDING',
verified_by UUID REFERENCES public.profiles(id),
verified_date TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.technician_portfolio (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
project_type TEXT NOT NULL,
title TEXT NOT NULL,
description TEXT,
before_photos TEXT[],
during_photos TEXT[],
after_photos TEXT[],
video_path TEXT,
completion_date DATE,
customer_permission BOOLEAN DEFAULT false,
visibility public.visibility_status NOT NULL DEFAULT 'PRIVATE',
is_featured BOOLEAN DEFAULT false,
company_verified BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۵. فعال‌سازی RLS
ALTER TABLE public.technician_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_portfolio ENABLE ROW LEVEL SECURITY;

-- ۶. سیاست‌های دسترسی تکنسین
CREATE POLICY "Tech_Manage_Own_Skills" ON public.technician_skills FOR ALL USING (auth.uid() = technician_id);
CREATE POLICY "Staff_Manage_All_Skills" ON public.technician_skills FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'));

CREATE POLICY "Tech_Manage_Own_Certs" ON public.technician_certifications FOR ALL USING (auth.uid() = technician_id);
CREATE POLICY "Staff_Manage_All_Certs" ON public.technician_certifications FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'));

CREATE POLICY "Tech_Manage_Own_Portfolio" ON public.technician_portfolio FOR ALL USING (auth.uid() = technician_id);
CREATE POLICY "Staff_Manage_All_Portfolio" ON public.technician_portfolio FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER'));
CREATE POLICY "Customers_View_Public_Portfolio" ON public.technician_portfolio FOR SELECT USING (visibility = 'PUBLIC' AND company_verified = true);