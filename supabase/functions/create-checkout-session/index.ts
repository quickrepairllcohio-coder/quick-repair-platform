import Stripe from 'npm:stripe@18.5.0'
import { withSupabase } from 'npm:@supabase/server'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_PUBLIC_URL')
    if (!stripeKey || !appUrl) return Response.json({ error: 'Payment configuration missing' }, { status: 500 })
    const { estimate_id } = await req.json()
    if (!estimate_id) return Response.json({ error: 'estimate_id required' }, { status: 400 })

    const { data: payment, error } = await ctx.supabase.rpc('create_checkout_payment', { p_estimate_id: estimate_id }).single()
    if (error) return Response.json({ error: error.message }, { status: 400 })

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-07-30.basil' })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: payment.currency, product_data: { name: `Quick Repair Job ${payment.job_id}` }, unit_amount: Math.round(Number(payment.amount) * 100) }, quantity: 1 }],
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancelled`,
      metadata: { payment_id: payment.id, estimate_id: payment.estimate_id, job_id: payment.job_id },
    })
    await ctx.supabase.from('payments').update({ checkout_session_id: session.id }).eq('id', payment.id)
    return Response.json({ checkout_url: session.url, payment_id: payment.id })
  }),
}
