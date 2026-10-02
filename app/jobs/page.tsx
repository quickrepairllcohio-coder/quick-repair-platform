import { createClient } from '@/utils/supabase/server'

export default async function JobsPage() {
const supabase = await createClient()

// دریافت لیست کارها به همراه اطلاعات مشتری از دیتابیس
const { data: jobs, error } = await supabase
.from('jobs')
.select(`
  id,
  title,
  status,
  created_at,
  profiles:customer_id (first_name, last_name, phone)
`)
.order('created_at', { ascending: false })

if (error) {
return (
  <div className="p-6 text-red-600 bg-red-50 rounded-lg">
    خطا در دریافت اطلاعات از دیتابیس: {error.message}
  </div>
)
}

return (
<div className="max-w-4xl mx-auto p-6" dir="rtl">
  <h1 className="text-2xl font-bold mb-6 text-gray-800">لیست کارهای فعال (Jobs)</h1>
  
  {jobs && jobs.length > 0 ? (
    <div className="grid gap-4">
      {jobs.map((job: any) => (
        <div key={job.id} className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {job.status}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            مشتری: {job.profiles?.first_name || 'نامشخص'} {job.profiles?.last_name || ''}
          </p>
          <div className="mt-3 text-xs text-gray-400">
            شناسه پروژه: {job.id}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
      هیچ کاری در دیتابیس ثبت نشده است.
    </div>
  )}
</div>
)
}