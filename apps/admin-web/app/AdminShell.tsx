'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

const groups = [
  {label:'Overview', items:[['/','Dashboard','⌂'],['/operations','Operations','◈'],['/live','Live map','◉']]},
  {label:'Work', items:[['/requests','Requests','≡'],['/dispatch','Dispatch','⇄'],['/scheduling','Scheduling','□'],['/technicians','Technicians','◌'],['/estimates','Estimates','▤']]},
  {label:'Customers', items:[['/crm','CRM','◎'],['/payments','Payments','$']]},
  {label:'Business', items:[['/finance','Finance','▣'],['/revenue','Revenue','↗'],['/expenses','Expenses','−'],['/inventory','Inventory','▦'],['/ledger','Ledger','⊞'],['/compliance','Compliance','✓']]},
]
function label(path:string){ for(const g of groups){const item=g.items.find(x=>x[0]===path);if(item)return item[1]} return 'Quick Repair Admin' }
export default function AdminShell({children,me}:{children:React.ReactNode,me:any}){
 const path=usePathname(); const initials=(me?.email||'QR').slice(0,2).toUpperCase()
 return <div className="qr-app">
   <aside className="qr-sidebar"><div className="qr-brand"><div className="qr-brand-mark">QR</div><div><div className="qr-brand-name">Quick Repair</div><div className="qr-brand-sub">Operations</div></div></div>
   <nav className="qr-nav">{groups.map(g=><div key={g.label}><div className="qr-nav-label">{g.label}</div>{g.items.map(([href,text,icon])=><Link key={href} href={href} className={path===href?'active':''}><span className="qr-nav-icon">{icon}</span>{text}</Link>)}</div>)}</nav>
   <div className="qr-sidebar-footer"><a href="/compliance">Production checks</a></div></aside>
   <div className="qr-main"><header className="qr-topbar"><div><div className="qr-topbar-title">{label(path)}</div><div className="qr-topbar-sub">Ohio operations · America/New_York</div></div><div className="qr-user"><div className="qr-user-avatar">{initials}</div><div style={{fontSize:12}}><div style={{fontWeight:800}}>{me?.email||'Admin'}</div><div className="qr-muted">{me?.role||'Staff'}</div></div><button className="qr-btn" onClick={async()=>{await supabase.auth.signOut();location.href='/login'}}>Sign out</button></div></header><div className="qr-content">{children}</div></div>
 </div>
}
