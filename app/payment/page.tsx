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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 relative inline-block">
              Complete Your Purchase
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-400/30 transform -rotate-1 translate-y-1"></div>
            </h1>
            
            <div className="mt-8">
              <div className="rounded-xl bg-gray-50 p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 relative inline-block">
                  Business Toolkit
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400/30"></div>
                </h2>
                <p className="mt-2 text-gray-600">Complete business planning toolkit with all assets</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">$25</span>
                  <span className="text-gray-500">/toolkit</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center text-gray-600">
                    <span className="text-emerald-500 mr-2">✓</span>
                    Custom business roadmap
                  </li>
                  <li className="flex items-center text-gray-600">
                    <span className="text-emerald-500 mr-2">✓</span>
                    Risk management strategies
                  </li>
                  <li className="flex items-center text-gray-600">
                    <span className="text-emerald-500 mr-2">✓</span>
                    Professional pitch deck
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={handlePayment}
                disabled={loading}
                className={`w-full px-6 py-4 bg-emerald-500 text-white rounded-xl text-lg font-medium
                         hover:bg-emerald-600 transform hover:scale-105 active:scale-95
                         transition duration-200 ease-in-out shadow-sm
                         ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Complete Purchase'}
              </button>
              <p className="mt-4 text-sm text-gray-500 text-center">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}