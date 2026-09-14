'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
export default function RevenuePage(){const [mult,setMult]=useState(''); const [status,setStatus]=useState(''); async function calc(){const {data,error}=await supabase.rpc('calculate_price_multiplier',{p_service_type_id: undefined as any,p_urgency:'emergency'});setStatus(error?.message||`Current emergency multiplier: ${data ?? '1.00'}x`);setMult(String(data??''));} return <main style={{padding:24,fontFamily:'sans-serif'}}><h1>Revenue Controls</h1><p>Manage recurring plans, tips and controlled emergency pricing rules.</p><button onClick={calc}>Check emergency multiplier</button><p>{status}</p><p>Dynamic pricing is rule-based and auditable; never use hidden pricing.</p></main>}


