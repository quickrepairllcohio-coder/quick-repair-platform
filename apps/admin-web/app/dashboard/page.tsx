import { createClient } from '../../utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // دریافت اطلاعات پروفایل
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'CUSTOMER'
  const firstName = profile?.first_name || user.email

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Repair Dashboard</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              Welcome back, {firstName} 
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">Role: {role}</span>
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-red-600 bg-red-50 px-5 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors">
              Sign Out
            </button>
          </form>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* منوهای مخصوص مدیران */}
          {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
            <>
              <Link href="/dashboard/jobs" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Jobs Management</h2>
                <p className="text-gray-500">View all repair jobs, assign technicians, and track system progress.</p>
              </Link>

              <Link href="/dashboard/technicians" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Technicians Team</h2>
                <p className="text-gray-500">Manage your repair team, view statuses, and add new staff.</p>
              </Link>
            </>
          )}

          {/* منوی مخصوص تکنسین */}
          {role === 'TECHNICIAN' && (
            <Link href="/dashboard/jobs" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-300 transition-all">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">My Assigned Jobs</h2>
              <p className="text-gray-500">View tasks assigned to you and update their current status.</p>
            </Link>
          )}

          {/* منوی مخصوص مشتری */}
          {role === 'CUSTOMER' && (
            <>
              <Link href="/dashboard/jobs/new" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Request Repair</h2>
                <p className="text-gray-500">Submit a new repair request and track its progress.</p>
              </Link>
              <Link href="/dashboard/jobs" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">My Requests</h2>
                <p className="text-gray-500">View your active and past repair requests.</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}