// app/payment/page.tsx
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { useUser } from '../../context/UserContext'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Payment() {
  const { session } = useUser()

  const handlePayment = async () => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: session?.user.email }),
    })
    const { sessionId } = await res.json()
    const stripe = await stripePromise
    if (stripe) {
      await stripe.redirectToCheckout({ sessionId })
    }
  }

  return (
    <div>
      <h1>Complete Your Payment</h1>
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  )
}