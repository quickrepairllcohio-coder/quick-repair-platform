import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !webhookSecret) return new Response('Webhook configuration missing', { status: 500 })
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-07-30.basil' })
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  let event: Stripe.Event
  try { event = await stripe.webhooks.constructEventAsync(body, signature ?? '', webhookSecret) }
  catch { return new Response('Invalid signature', { status: 400 }) }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session
    const { data: payment } = await supabase.from('payments').update({ status: 'succeeded', provider_payment_id: String(s.payment_intent ?? '') }).eq('checkout_session_id', s.id).select('id').maybeSingle()
    if (payment?.id) await supabase.rpc('mark_invoice_paid_from_payment', { p_payment_id: payment.id })
  }
  if (event.type === 'checkout.session.async_payment_failed') {
    const s = event.data.object as Stripe.Checkout.Session
    await supabase.from('payments').update({ status: 'failed', failure_message: 'Stripe checkout payment failed' }).eq('checkout_session_id', s.id)
  }
  return Response.json({ received: true })
})
