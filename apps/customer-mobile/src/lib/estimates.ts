import { supabase } from './supabase'
export async function approveEstimate(estimateId: string) {
  const { data, error } = await supabase.rpc('customer_approve_estimate', { p_estimate_id: estimateId })
  if (error) throw error
  return data
}
