// app/payment/page.tsx
'use client'

import { loadStripe } from '@stripe/stripe-js'
import { useUser } from '../../context/UserContext'
import { useState } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function Payment() {
  const { session } = useUser()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: session?.user.email,
          userId: session?.user.id 
        }),
      })
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (error) {
      console.error('Payment error:', error)
      // Add error handling UI here
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-8 bg-gradient-to-b from-[#1a1f2e] to-[#2d1810]">
      <div className="max-w-3xl mx-auto bg-[#232a3b] rounded-2xl shadow-2xl p-10 border border-amber-900/30">
        <h1 className="text-4xl font-bold mb-6 text-amber-500 font-serif">Complete Your Quest</h1>
        <p className="text-xl mb-8 text-amber-100/90">
          Your plan is ready! Complete your payment to receive your custom project assets.
        </p>
        <button 
          onClick={handlePayment}
          disabled={loading}
          className={`px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700
                    text-white rounded-xl text-lg font-semibold
                    hover:from-amber-700 hover:to-amber-800
                    transform hover:scale-105 active:scale-95
                    transition duration-200 ease-in-out
                    shadow-lg hover:shadow-xl
                    border border-amber-500/30
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Processing...' : 'Pay Now (Test Mode)'}
        </button>
      </div>
    </div>
  )
}