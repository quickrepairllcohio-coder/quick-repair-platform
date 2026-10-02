-- ۱. پاکسازی نسخه‌های قدیمی که به صورت دستی ساخته شده بودند
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_role CASCADE;

-- ۲. ایجاد لیست نقش‌های مجاز
CREATE TYPE public.user_role AS ENUM (
'SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER', 
'ACCOUNTANT', 'OFFICE_STAFF', 'TECHNICIAN', 'CUSTOMER'
);

-- ۳. ایجاد جدول پروفایل کاربران
CREATE TABLE public.profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
role public.user_role NOT NULL DEFAULT 'CUSTOMER',
first_name TEXT,
last_name TEXT,
phone TEXT,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۴. ساخت تابع امنیتی
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$;

-- ۵. قفل کردن جدول پروفایل‌ها (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ۶. سیاست‌های دسترسی
CREATE POLICY "Users_Read_Own_Profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff_Read_All_Profiles" ON public.profiles FOR SELECT USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'DISPATCHER', 'ACCOUNTANT'));
CREATE POLICY "Users_Update_Own_Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);