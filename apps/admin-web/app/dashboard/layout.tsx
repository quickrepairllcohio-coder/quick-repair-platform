import RealtimeListener from '../../components/RealtimeListener'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {/* تزریق کامپوننت Real-time در پس‌زمینه کل داشبورد */}
      <RealtimeListener />
      {children}
    </section>
  )
}