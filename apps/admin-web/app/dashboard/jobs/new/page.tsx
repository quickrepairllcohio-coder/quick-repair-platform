import { createClient } from '../../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const createJob = async (formData: FormData) => {
    'use server'
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const file = formData.get('image') as File | null
    
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    
    if (!user) return

    let imageUrl = null

    // اگر فایلی آپلود شده باشد، آن را در Storage ذخیره می‌کنیم
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      const { error: uploadError } = await supabaseServer.storage
        .from('job_images')
        .upload(filePath, file)
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabaseServer.storage
          .from('job_images')
          .getPublicUrl(filePath)
        imageUrl = publicUrl
      }
    }

    // ثبت سفارش جدید به همراه آدرس عکس (در صورت وجود)
    await supabaseServer.from('jobs').insert([{ 
      title, 
      description, 
      customer_id: user.id,
      status: 'PENDING',
      image_url: imageUrl
    }])
    
    redirect('/dashboard/jobs')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">&larr; Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-gray-900">Request a Repair</h1>
        </header>

        <main className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <form action={createJob} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Title</label>
              <input type="text" name="title" required placeholder="e.g., AC not cooling down" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" required rows={4} placeholder="Please describe the issue in detail..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Attach Photo (Optional)</label>
              <input type="file" name="image" accept="image/*" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <p className="mt-1 text-xs text-gray-500">Upload a picture of the damaged device to help our technicians.</p>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Submit Request
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}