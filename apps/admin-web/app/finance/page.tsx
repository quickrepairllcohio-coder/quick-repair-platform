'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Dashboard = { revenue:number; payments_count:number; refunds:number; ar_open:number; jobs_completed:number; material_cost:number; labor_cost:number; gross_profit:number; from:string; to:string };

type ProfitRow = { job_id:string; job_number:string; completed_at:string; revenue:number; material_cost:number; labor_cost:number; gross_profit:number; gross_margin_pct:number };

const money=(v:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0));

export default function FinancePage(){
  const [dash,setDash]=useState<Dashboard|null>(null); const [rows,setRows]=useState<ProfitRow[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{ (async()=>{
    const from=new Date(Date.now()-29*86400000).toISOString().slice(0,10); const to=new Date().toISOString().slice(0,10);
    const [{data:d,error:de},{data:p,error:pe}] = await Promise.all([
      supabase.rpc('finance_dashboard',{p_from:from,p_to:to}),
      supabase.rpc('job_profitability_report',{p_from:from,p_to:to})
    ]);
    if(de||pe){setError(de?.message||pe?.message||'Unable to load finance data');} else {setDash(d as Dashboard); setRows((p||[]) as ProfitRow[]);} setLoading(false);
  })(); },[]);
  if(loading)return <main style={{padding:32}}><h1>Financial Intelligence</h1><p>Loading…</p></main>;
  return <main style={{padding:32,fontFamily:'system-ui'}}>
    <h1>Financial Intelligence</h1><p>Last 30 days operational summary</p>{error&&<p style={{color:'crimson'}}>{error}</p>}
    {dash&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,margin:'24px 0'}}>
      {([['Revenue',money(dash.revenue)],['Gross Profit',money(dash.gross_profit)],['Gross Margin',dash.revenue?`${((dash.gross_profit/dash.revenue)*100).toFixed(1)}%`:'0%'],['AR Open',money(dash.ar_open)],['Material Cost',money(dash.material_cost)],['Labor Cost',money(dash.labor_cost)],['Completed Jobs',dash.jobs_completed],['Payments',dash.payments_count]] as [string,string|number][]).map(([k,v])=><section key={k} style={{border:'1px solid #ddd',borderRadius:12,padding:16}}><div style={{fontSize:13,opacity:.65}}>{k}</div><strong style={{fontSize:22}}>{v}</strong></section>)}
    </div>}
    <h2>Job Profitability</h2>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Job','Revenue','Materials','Labor','Gross Profit','Margin'].map(h=><th key={h} style={{textAlign:'left',borderBottom:'1px solid #ddd',padding:10}}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.job_id}>{[r.job_number,money(r.revenue),money(r.material_cost),money(r.labor_cost),money(r.gross_profit),`${r.gross_margin_pct}%`].map((v,i)=><td key={i} style={{padding:10,borderBottom:'1px solid #eee'}}>{v}</td>)}</tr>)}</tbody></table></div>
  </main>
}
