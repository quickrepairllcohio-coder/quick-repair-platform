'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ExpensesPage(){
  const [rows,setRows]=useState<any[]>([]); const [summary,setSummary]=useState<any>(null); const [error,setError]=useState('');
  useEffect(()=>{ (async()=>{
    const {data,error}=await supabase.from('expenses').select('expense_number,expense_date,scope,category,subtotal,tax,total,status,job_id,vendors(name)').order('expense_date',{ascending:false}).limit(100);
    if(error) setError(error.message); else setRows(data||[]);
    const s=await supabase.rpc('expense_summary',{}); if(!s.error) setSummary(s.data);
  })(); },[]);
  return <main style={{padding:24,fontFamily:'Arial'}}><h1>Expenses & Vendors</h1>
    {summary && <div style={{display:'flex',gap:24,margin:'16px 0'}}><b>Total: ${Number(summary.total||0).toFixed(2)}</b><span>Job: ${Number(summary.job_expenses||0).toFixed(2)}</span><span>Company: ${Number(summary.company_expenses||0).toFixed(2)}</span><span>Tax: ${Number(summary.tax||0).toFixed(2)}</span></div>}
    {error && <p>{error}</p>}
    <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Number','Date','Vendor','Scope','Category','Subtotal','Tax','Total','Status'].map(x=><th key={x} style={{textAlign:'left',padding:8,borderBottom:'1px solid #ddd'}}>{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.expense_number}>{<><td style={{padding:8}}>{r.expense_number}</td><td style={{padding:8}}>{r.expense_date}</td><td style={{padding:8}}>{r.vendors?.name||'—'}</td><td style={{padding:8}}>{r.scope}</td><td style={{padding:8}}>{r.category}</td><td style={{padding:8}}>${Number(r.subtotal).toFixed(2)}</td><td style={{padding:8}}>${Number(r.tax).toFixed(2)}</td><td style={{padding:8}}>${Number(r.total).toFixed(2)}</td><td style={{padding:8}}>{r.status}</td></>}</tr>)}</tbody></table>
  </main>
}
