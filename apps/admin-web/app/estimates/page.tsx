'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
export default function EstimatesPage() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { supabase.from('estimates').select('*').order('created_at', { ascending:false }).limit(50).then(({data}) => setItems(data ?? [])) }, [])
  return <main style={{padding:24,fontFamily:'system-ui'}}><h1>Estimates</h1><p>Customer estimates and approval state.</p><table><thead><tr><th>Estimate</th><th>Job</th><th>Status</th><th>Total</th></tr></thead><tbody>{items.map(x => <tr key={x.id}><td>{x.estimate_number}</td><td>{x.job_id}</td><td>{x.status}</td><td>${Number(x.total).toFixed(2)}</td></tr>)}</tbody></table></main>
}
