import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const jobPostId = session.metadata?.job_post_id
    if (!jobPostId) {
      return new Response('Missing job_post_id in session metadata', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Mark payment as paid
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        stripe_payment_intent: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
        updated_at: now.toISOString(),
      })
      .eq('stripe_session_id', session.id)

    if (paymentError) {
      console.error('Failed to update payment:', paymentError)
      return new Response('Failed to update payment record', { status: 500 })
    }

    // Publish the job post
    const { error: jobError } = await supabase
      .from('job_posts')
      .update({ status: 'published' })
      .eq('id', jobPostId)

    if (jobError) {
      console.error('Failed to publish job post:', jobError)
      return new Response('Failed to publish job post', { status: 500 })
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
