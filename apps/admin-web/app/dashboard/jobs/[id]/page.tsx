import { createClient } from '../../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const jobId = resolvedParams.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  const userRole = currentUserProfile?.role

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *, 
      customer:profiles!jobs_customer_id_fkey(first_name, last_name),
      technician:profiles!jobs_technician_id_fkey(first_name, last_name)
    `)
    .eq('id', jobId)
    .single()

  let technicians = []
  if (userRole !== 'TECHNICIAN' && userRole !== 'CUSTOMER') {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'TECHNICIAN')
    technicians = data || []
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">Job Not Found or Access Denied</h2>
        <Link href="/dashboard/jobs" className="text-blue-600 underline">Return to Jobs</Link>
      </div>
    )
  }

  const updateJob = async (formData: FormData) => {
    'use server'
    const newStatus = formData.get('status') as string
    const techId = formData.get('technician_id') as string | null
    
    const supabaseServer = await createClient()
    const updateData: any = { status: newStatus }
    
    if (techId !== null) {
      updateData.technician_id = techId === 'unassigned' ? null : techId
    }
    
    await supabaseServer.from('jobs').update(updateData).eq('id', jobId)
    redirect('/dashboard/jobs')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/dashboard/jobs" className="text-gray-500 hover:text-gray-900 font-medium">&larr; Back</Link>
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">{job.status}</span>
        </header>

        <main className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h2>
            <p className="text-gray-600 whitespace-pre-wrap mb-4">{job.description || 'No description provided.'}</p>
            
            {/* بخش نمایش تصویر اضافه شد */}
            {job.image_url && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100 inline-block">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Attached Photo</h3>
                <img src={job.image_url} alt="Issue Attachment" className="max-w-full md:max-w-md rounded-lg shadow-sm" />
              </div>
            )}
          </div>
          
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-12">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Info</h3>
              <p className="text-gray-900 font-medium">{job.customer?.first_name || 'System User'}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Technician</h3>
              <p className="text-gray-900 font-medium">
                {job.technician ? `${job.technician.first_name} ${job.technician.last_name}` : 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Update Job Status</h3>
            <form action={updateJob} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" defaultValue={job.status} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="PENDING">Pending</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="EN_ROUTE">En Route</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                
                {userRole !== 'TECHNICIAN' && userRole !== 'CUSTOMER' && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician</label>
                    <select name="technician_id" defaultValue={job.technician_id || 'unassigned'} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="unassigned">-- Unassigned --</option>
                      {technicians?.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.first_name} {tech.last_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}