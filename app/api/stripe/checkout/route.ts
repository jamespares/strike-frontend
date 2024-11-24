import { NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripeClient'

export async function POST(request: Request) {
  const { email } = await request.json()

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: 'price_1QOjBsGrklpW0Vx9k4gigQKU', // Replace the product ID with the price ID
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment`,
      metadata: {
        userEmail: email
      }
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
