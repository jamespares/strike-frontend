// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { supabase } from '@/lib/clients/supabaseClient'
import { AssetGenerationStatus } from '@/lib/types/assets'

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

      // Initialize survey responses with empty values
      await supabaseClient
        .from('survey_responses')
        .upsert({ 
          user_id: userData.id,
          key_goals: '',
          key_risks: '',
          deadline: new Date().toISOString(),
          budget: 0
        })

      // Get survey responses
      const { data: surveyData, error: surveyError } = await supabaseClient
        .from('survey_responses')
        .select('*')
        .eq('user_id', userData.id)
        .single()

      if (surveyError || !surveyData) {
        throw new Error('Survey responses not found')
      }

      // Update payment status first
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ payment_status: 'paid' })
        .eq('id', userData.id)

      if (updateError) throw updateError

      // Initialize asset record with all URLs set to null
      await supabaseClient
        .from('user_assets')
        .upsert({ 
          user_id: userData.id,
          payment_status: 'paid',
          generation_status: AssetGenerationStatus.PENDING,
          roadmap_url: null,
          gantt_chart_url: null,
          gantt_csv_url: null,
          budget_tracker_url: null,
          budget_csv_url: null,
          risk_log_url: null,
          risk_csv_url: null
        })
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
