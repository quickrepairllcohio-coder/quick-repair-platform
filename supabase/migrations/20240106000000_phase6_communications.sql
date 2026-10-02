-- ۱. پاکسازی جداول قبلی
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- ۲. مقادیر ENUM برای انواع نوتیفیکیشن
CREATE TYPE public.notification_type AS ENUM ('SYSTEM', 'JOB_UPDATE', 'PAYMENT', 'MESSAGE_ALERT');

-- ۳. جدول گفتگوها (متصل به یک Job خاص)
CREATE TABLE public.conversations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۴. جدول پیام‌ها (چت‌های درون یک گفتگو)
CREATE TABLE public.messages (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
sender_id UUID NOT NULL REFERENCES public.profiles(id),
content TEXT NOT NULL,
is_read BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۵. جدول نوتیفیکیشن‌ها (پیام‌های سیستمی برای کاربر)
CREATE TABLE public.notifications (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
title TEXT NOT NULL,
message TEXT NOT NULL,
type public.notification_type NOT NULL DEFAULT 'SYSTEM',
is_read BOOLEAN DEFAULT false,
action_link TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ۶. فعال‌سازی امنیت (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ۷. سیاست‌های امنیتی نوتیفیکیشن‌ها (هر کاربر فقط اعلان‌های خودش را می‌بیند)
CREATE POLICY "Users_Manage_Own_Notifications" ON public.notifications 
FOR ALL USING (auth.uid() = user_id);

-- ۸. سیاست‌های امنیتی گفتگوها (مشتری و تکنسین فقط چت‌های Job خودشان را می‌بینند)
CREATE POLICY "Users_View_Own_Conversations" ON public.conversations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = conversations.job_id
        AND (j.customer_id = auth.uid() OR j.technician_id = auth.uid() OR public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'DISPATCHER'))
    )
);

-- ۹. سیاست‌های امنیتی پیام‌ها
CREATE POLICY "Users_Insert_Messages" ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users_View_Messages" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        LEFT JOIN public.jobs j ON c.job_id = j.id
        WHERE c.id = messages.conversation_id 
        AND (j.customer_id = auth.uid() OR j.technician_id = auth.uid() OR public.get_auth_role() IN ('SUPER_ADMIN', 'ADMIN', 'DISPATCHER'))
    )
);