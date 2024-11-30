import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { generateProjectPlan } from '@/lib/utils/generateProjectPlan'
import { SurveyData } from '@/lib/types/survey'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  const headers = request.headers
  const body = await request.text()
  const signature = headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      
      if (!userId) {
        throw new Error('User ID not found in session metadata')
      }

      // First update payment status
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ payment_status: 'paid' })
        .eq('id', userId)

      if (updateError) throw updateError

      // Then fetch survey data
      const { data: surveyData, error: surveyError } = await supabaseAdmin
        .from('survey_responses')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (surveyError) throw surveyError

      // Generate and save project plan
      const projectPlan = await generateProjectPlan(surveyData as SurveyData)
      
      // Delete any existing plan first
      await supabaseAdmin
        .from('project_plans')
        .delete()
        .eq('user_id', userId)

      // Then insert new plan
      const { error: planError } = await supabaseAdmin
        .from('project_plans')
        .insert({
          user_id: userId,
          plan: projectPlan,
        })

      if (planError) throw planError
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
