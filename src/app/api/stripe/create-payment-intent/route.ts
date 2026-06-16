import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { amount, fund_id, fund_name, donor_name, donor_email, note } = await req.json()

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum donation is $1.00' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: 'usd',
      metadata: { fund_id, fund_name, donor_name: donor_name || '', donor_email: donor_email || '', note: note || '' },
      receipt_email: donor_email || undefined,
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
