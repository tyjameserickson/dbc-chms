import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (webhookSecret && webhookSecret !== 'whsec_...') {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const { fund_id, fund_name, donor_name, donor_email, note } = pi.metadata

    let person_id: string | null = null
    if (donor_email) {
      const { data: person } = await supabase
        .from('people').select('id').eq('email', donor_email).single()
      person_id = person?.id ?? null
    }

    let resolvedFundId = fund_id
    if (!resolvedFundId && fund_name) {
      const { data: fund } = await supabase
        .from('funds').select('id').ilike('name', fund_name).single()
      resolvedFundId = fund?.id
    }
    if (!resolvedFundId) {
      const { data: fund } = await supabase
        .from('funds').select('id').order('created_at').limit(1).single()
      resolvedFundId = fund?.id
    }

    await supabase.from('giving_transactions').insert({
      person_id,
      fund_id: resolvedFundId,
      amount: pi.amount / 100,
      method: 'card',
      stripe_payment_intent_id: pi.id,
      given_at: new Date(pi.created * 1000).toISOString(),
      notes: [donor_name, note].filter(Boolean).join(' — ') || null,
    })
  }

  return NextResponse.json({ received: true })
}
