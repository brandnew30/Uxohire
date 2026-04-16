import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { job_post_id } = await req.json()
    if (!job_post_id) throw new Error('Missing job_post_id')

    // Authenticate calling user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Service-role client bypasses RLS for admin writes
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify job post belongs to this user and is awaiting payment
    const { data: jobPost, error: jobPostError } = await supabaseAdmin
      .from('job_posts')
      .select('id, title, company, status')
      .eq('id', job_post_id)
      .eq('user_id', user.id)
      .single()

    if (jobPostError || !jobPost) throw new Error('Job post not found or unauthorized')
    if (jobPost.status !== 'pending_payment') throw new Error('Job post is not pending payment')

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const origin = req.headers.get('origin') || 'https://uxohire.vercel.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'UXOHire Job Posting — 30-Day Listing',
            description: `${jobPost.title} at ${jobPost.company}`,
          },
          unit_amount: 14900, // $149.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/job-post-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/post-job`,
      metadata: {
        job_post_id,
        user_id: user.id,
      },
    })

    // Record the pending payment — service role skips RLS
    await supabaseAdmin.from('payments').insert({
      job_post_id,
      employer_id: user.id,
      stripe_session_id: session.id,
      amount_cents: 14900,
      currency: 'usd',
      status: 'pending',
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
