export const dynamic = 'force-dynamic';
import { createClient } from '../../../utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`id, title, status, created_at, customer:profiles!jobs_customer_id_fkey(first_name, last_name)`)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs Management</h1>
            <p className="text-gray-600 mt-2">Manage and track all service requests and work orders.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
              Back to Dashboard
            </Link>
            <Link href="/dashboard/jobs/new" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
              + New Job
            </Link>
          </div>
        </header>

        <main className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {!jobs || jobs.length === 0 ? (
            <div className="p-16 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
              <p className="text-gray-500">Get started by creating a new service request.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.customer?.first_name || 'Admin (Test)'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/jobs/${job.id}`} className="text-blue-600 hover:text-blue-900">
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  )
}