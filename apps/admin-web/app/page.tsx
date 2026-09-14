'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type RequestRow = { id:string; request_number:string; title:string|null; urgency:string; status:string; created_at:string; service_categories?: {name:string}|null }

type Tech = { id:string; status:string; rating:number|null; user_id:string }

export default function DispatcherDashboard(){
  const [requests,setRequests]=useState<RequestRow[]>([])
  const [techs,setTechs]=useState<Tech[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(''); const [me,setMe]=useState<any>(null)

  async function load(){
    setLoading(true); setError('')
    const [r,t]=await Promise.all([
      supabase.from('service_requests').select('id,request_number,title,urgency,status,created_at,service_categories(name)').in('status',['submitted','triage','reviewing','estimate_required']).order('created_at',{ascending:false}).limit(50),
      supabase.from('technicians').select('id,status,rating,user_id').in('status',['available','offline','busy']).limit(100)
    ])
    if(r.error) setError(r.error.message); else setRequests((r.data||[]) as RequestRow[])
    if(!t.error) setTechs((t.data||[]) as Tech[])
    setLoading(false)
  }

  useEffect(()=>{ load(); supabase.rpc('admin_me').then(({data})=>setMe(data)); const channel=supabase.channel('dispatcher:requests',{config:{private:true}}).on('broadcast',{event:'request_changed'},()=>load()).subscribe(); return()=>{supabase.removeChannel(channel)} },[])

  return <main style={{fontFamily:'Arial,sans-serif',padding:28,maxWidth:1400,margin:'0 auto'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><div><h1 style={{margin:0}}>Quick Repair — Dispatcher Center</h1><p style={{color:'#666'}}>Live operations control</p></div><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{color:'#666'}}>{me?.email||''} · {me?.role||''}</span><button onClick={load}>Refresh</button><button onClick={async()=>{await supabase.auth.signOut(); location.href='/login'}}>Sign out</button></div></header>
    {error && <div style={{background:'#fee2e2',padding:12,borderRadius:10,marginBottom:16}}>{error}</div>}
    <section style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
      <Card label="New Requests" value={requests.length}/><Card label="Emergency" value={requests.filter(x=>x.urgency==='emergency').length}/><Card label="Available Techs" value={techs.filter(x=>x.status==='available').length}/><Card label="Operational Techs" value={techs.length}/>
    </section>
    <section style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:18}}>
      <div style={panel}><h2>Request Queue</h2>{loading?<p>Loading…</p>:requests.length===0?<p>No open requests.</p>:requests.map(r=><div key={r.id} style={{borderTop:'1px solid #eee',padding:'15px 0'}}><div style={{display:'flex',justifyContent:'space-between'}}><strong>{r.request_number}</strong><span>{r.urgency.toUpperCase()}</span></div><div>{r.title||'Service request'} · {r.service_categories?.name||'Uncategorized'}</div><small style={{color:'#666'}}>{r.status} · {new Date(r.created_at).toLocaleString()}</small></div>)}</div>
      <div style={panel}><h2>Technicians</h2>{techs.map(t=><div key={t.id} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderTop:'1px solid #eee'}}><span>{t.id.slice(0,8)}…</span><b>{t.status}</b></div>)}</div>
    </section>
  </main>
}
function Card({label,value}:{label:string,value:number}){return <div style={panel}><div style={{color:'#666'}}>{label}</div><strong style={{fontSize:30}}>{value}</strong></div>}
const panel={border:'1px solid #ddd',borderRadius:14,padding:18,background:'#fff'}

