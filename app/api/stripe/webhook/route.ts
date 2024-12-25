import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment succeeded:', paymentIntent.id)

        const userId = paymentIntent.metadata.user_id
        if (!userId) {
          console.error('No user ID found in payment intent metadata')
          throw new Error('No user ID found in payment intent metadata')
        }

        // Update user's payment status
        const { error: userError } = await supabase
          .from('users')
          .update({ payment_status: 'paid' })
          .eq('id', userId)

        if (userError) {
          console.error('Error updating user payment status:', userError)
          throw userError
        }

        console.log('Successfully updated payment status for user:', userId)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', failedPayment.id)

        const failedUserId = failedPayment.metadata.user_id
        if (failedUserId) {
          // Update user's payment status to failed
          const { error: failedUserError } = await supabase
            .from('users')
            .update({ payment_status: 'failed' })
            .eq('id', failedUserId)

          if (failedUserError) {
            console.error('Error updating user payment status:', failedUserError)
            throw failedUserError
          }
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
}
