// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/clients/stripeClient'
import { headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateProjectAssets } from '@/lib/utils/generateProjectPlan'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const supabase = createRouteHandlerClient({ cookies })

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.customer_email)
        .single()

      if (userError || !userData) {
        throw new Error('User not found')
      }

      // Get survey responses
      const { data: surveyData, error: surveyError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', userData.id)
        .single()

      if (surveyError || !surveyData) {
        throw new Error('Survey responses not found')
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from('users')
        .update({ payment_status: 'paid' })
        .eq('id', userData.id)

      if (updateError) throw updateError

      // Generate assets
      try {
        console.log('Starting asset generation for user:', userData.id)
        console.log('Survey data:', JSON.stringify(surveyData, null, 2))
        await generateProjectAssets(userData.id, surveyData)
        console.log('Asset generation completed successfully')
      } catch (error) {
        console.error('Asset generation failed:', error)
        console.error('Error stack:', error.stack)
        throw error
      }
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
