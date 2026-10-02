-- ۱. ایجاد باکت‌های اصلی
INSERT INTO storage.buckets (id, name, public)
VALUES 
('avatars', 'avatars', true),
('certifications', 'certifications', false),
('job_attachments', 'job_attachments', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ۲. پاکسازی قوانین امنیتی احتمالی قدیمی
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Certifications authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Certifications authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Job attachments authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "Job attachments authenticated insert" ON storage.objects;

-- ۳. قوانین امنیتی تصاویر پروفایل (خواندن آزاد، آپلود برای کاربران لاگین‌شده)
CREATE POLICY "Avatar public read" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar authenticated insert" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ۴. قوانین امنیتی مدارک (فقط کاربران لاگین‌شده)
CREATE POLICY "Certifications authenticated read" ON storage.objects 
FOR SELECT USING (bucket_id = 'certifications' AND auth.role() = 'authenticated');
CREATE POLICY "Certifications authenticated insert" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'certifications' AND auth.role() = 'authenticated');

-- ۵. قوانین امنیتی فایل‌های پروژه/خرابی‌ها (فقط کاربران لاگین‌شده)
CREATE POLICY "Job attachments authenticated read" ON storage.objects 
FOR SELECT USING (bucket_id = 'job_attachments' AND auth.role() = 'authenticated');
CREATE POLICY "Job attachments authenticated insert" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'job_attachments' AND auth.role() = 'authenticated');