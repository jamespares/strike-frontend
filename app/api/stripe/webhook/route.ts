// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '../../../../lib/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
})

export async function POST(request: Request) {
  const payload = await request.text()
  const sig = request.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Get the user's email from the session
    const email = session.customer_email

    // Fetch the user's ID from Supabase using their email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError?.message)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userData.id

    // Trigger AI processing
    // You can use a background job or serverless function here

    // For example:
    await triggerAIProcessing(userId)
  }

  return NextResponse.json({ received: true })
}
