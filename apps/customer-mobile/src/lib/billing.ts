import * as WebBrowser from 'expo-web-browser'
import { supabase } from './supabase'

export async function createCheckout(estimateId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { estimate_id: estimateId } })
  if (error) throw error
  if (!data?.checkout_url) throw new Error('Checkout URL was not returned')
  await WebBrowser.openBrowserAsync(data.checkout_url)
  return data
}

export async function approveChangeOrder(changeOrderId: string) {
  const { data, error } = await supabase.rpc('customer_approve_change_order', { p_change_order_id: changeOrderId })
  if (error) throw error
  return data
}
