'use client'
import { useEffect,useState } from 'react'
import { usePathname,useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import AdminShell from './AdminShell'
export default function AdminGate({children}:{children:React.ReactNode}){
 const path=usePathname(); const router=useRouter(); const [ready,setReady]=useState(false); const [me,setMe]=useState<any>(null)
 useEffect(()=>{let mounted=true; (async()=>{const {data:{session}}=await supabase.auth.getSession(); if(!session){if(path!=='/login')router.replace('/login'); if(mounted)setReady(true); return} const {data,error}=await supabase.rpc('admin_me'); const allowed=['dispatcher','supervisor','estimator','finance','admin','super_admin']; if(error||!data||!allowed.includes((data as any).role)||(data as any).status!=='active'){await supabase.auth.signOut();router.replace('/login');if(mounted)setReady(true);return} setMe(data); if(path==='/login')router.replace('/'); if(mounted)setReady(true)})().catch(()=>{if(mounted)setReady(true)}); return()=>{mounted=false}},[path,router]);
 if(!ready)return <main className="qr-login"><div className="qr-login-card"><div className="qr-login-brand"><div className="qr-brand-mark">QR</div><strong>Quick Repair</strong></div><div className="qr-muted">Loading secure workspaceâ€¦</div></div></main>;
 if(path==='/login')return <>{children}</>;
 return <AdminShell me={me}>{children}</AdminShell>
}

