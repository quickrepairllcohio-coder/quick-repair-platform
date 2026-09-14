'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Row = { id:string; sku:string|null; name:string; unit:string; reorder_point:number; on_hand:number; needs_reorder:boolean };
export default function InventoryPage(){
 const [rows,setRows]=useState<Row[]>([]); const [loading,setLoading]=useState(true);
 useEffect(()=>{ supabase.from('material_inventory_summary').select('*').order('name').then(({data})=>{setRows((data??[]) as Row[]);setLoading(false);}); },[]);
 return <main style={{padding:32,fontFamily:'system-ui'}}><h1>Inventory</h1><p>Material on-hand and reorder alerts.</p>{loading?<p>Loading…</p>:<table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['SKU','Material','Unit','On Hand','Reorder Point','Status'].map(h=><th key={h} style={{textAlign:'left',padding:8,borderBottom:'1px solid #ddd'}}>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}><td style={{padding:8}}>{r.sku??'—'}</td><td style={{padding:8}}>{r.name}</td><td style={{padding:8}}>{r.unit}</td><td style={{padding:8}}>{r.on_hand}</td><td style={{padding:8}}>{r.reorder_point}</td><td style={{padding:8}}>{r.needs_reorder?'Reorder':'OK'}</td></tr>)}</tbody></table>}</main>
}
