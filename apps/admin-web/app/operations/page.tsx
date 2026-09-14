'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';

export default function Operations(){
 const [data,setData]=useState<any>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{supabase.rpc('operations_dashboard').then(({data,error})=>{if(!error)setData(data);setLoading(false)});},[]);
 return <main style={{padding:24,fontFamily:'Arial'}}><h1>Operations Center</h1><p>Live operational overview for Quick Repair.</p>
 {loading?<p>Loading…</p>:<div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(180px,1fr))',gap:16}}>{[
 ['Open Requests',data?.open_requests],['Active Jobs',data?.active_jobs],['Completed Today',data?.completed_today],['Open Invoices',data?.open_invoices],['Paid Today',`$${Number(data?.paid_today||0).toFixed(2)}`],['Emergency Queue',data?.emergency_requests]
 ].map(([k,v])=><section key={String(k)} style={{border:'1px solid #ddd',borderRadius:12,padding:18}}><small>{k}</small><h2>{v}</h2></section>)}</div>}</main>
}
