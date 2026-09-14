'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
export default function CompliancePage(){
  const [snapshot,setSnapshot]=useState<any>(null); const [error,setError]=useState('');
  useEffect(()=>{supabase.rpc('production_release_snapshot').then(({data,error})=>{if(error)setError(error.message);else setSnapshot(data);});},[]);
  return <main style={{padding:24,fontFamily:'Arial'}}><h1>Compliance & Production Health</h1>{error&&<p>{error}</p>}<pre>{JSON.stringify(snapshot,null,2)}</pre><p>Verify licenses, certifications, insurance and background checks before dispatch.</p></main>
}
