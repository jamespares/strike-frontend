import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/clients/supabaseClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

export async function POST(request: Request) {
  const headers = request.headers
  const body = await request.text()
  const signature = headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const supabaseClient = createRouteHandlerClient({ cookies: request.headers })

      // Get user data
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('email', session.customer_email)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      // Update payment status only
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ payment_status: 'paid' })
        .eq('id', userData.id)

      if (updateError) throw updateError
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    )
  }
}
