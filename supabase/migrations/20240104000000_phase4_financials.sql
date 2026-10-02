-- ۱. پاکسازی جداول قدیمی و تست‌های دستی
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.estimates CASCADE;
DROP TYPE IF EXISTS public.estimate_status CASCADE;
DROP TYPE IF EXISTS public.invoice_status CASCADE;

-- ۲. مقادیر ENUM برای وضعیت فرم‌های مالی
CREATE TYPE public.estimate_status AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'CHANGE_REQUESTED', 'REJECTED');
CREATE TYPE public.invoice_status AS ENUM ('DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- ۳. جدول پیش‌فاکتورها (Estimates)
CREATE TABLE public.estimates (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
customer_id UUID NOT NULL REFERENCES public.profiles(id),
status public.estimate_status NOT NULL DEFAULT 'DRAFT',
subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
tax NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
notes TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۴. جدول فاکتورهای نهایی (Invoices)
CREATE TABLE public.invoices (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
customer_id UUID NOT NULL REFERENCES public.profiles(id),
status public.invoice_status NOT NULL DEFAULT 'DRAFT',
amount_due NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
due_date DATE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۵. قفل‌گذاری و فعال‌‌سازی RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ۶. سیاست‌های امنیتی پیش‌‌فاکتور (مشتری فقط می‌بیند، ادمین/حسابدار مدیریت می‌کند)
CREATE POLICY "Customers_View_Own_Estimates" ON public.estimates
FOR SELECT USING (auth.uid() = customer_id AND status != 'DRAFT');

CREATE POLICY "Staff_Manage_All_Estimates" ON public.estimates
FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'DISPATCHER'));

-- ۷. سیاست‌های امنیتی فاکتور (مشتری فقط می‌بیند، ادمین/حسابدار مدیریت می‌کند)
CREATE POLICY "Customers_View_Own_Invoices" ON public.invoices
FOR SELECT USING (auth.uid() = customer_id AND status != 'DRAFT');

CREATE POLICY "Staff_Manage_All_Invoices" ON public.invoices
FOR ALL USING (public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT'));