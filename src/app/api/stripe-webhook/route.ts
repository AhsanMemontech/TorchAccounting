import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { TrialManager } from '@/lib/trialManager'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Webhook: Missing stripe signature')
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event

  try {
    // Verify webhook signature
    event = stripe?.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )
    console.log('Webhook: Signature verified successfully')
  } catch (error) {
    console.error('Webhook: Signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    console.log('Webhook: Processing event type:', event?.type)
    
    switch (event?.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any
        console.log('Webhook: Processing checkout.session.completed for session:', session.id)
        
        // Mark user as paid
        if (session.metadata?.userId) {
          console.log('Webhook: Marking user as paid:', session.metadata.userId)
          await TrialManager.markAsPaid(
            session.metadata.userId,
            session.id,
            session.amount_total
          )
          console.log('Webhook: Successfully marked user as paid')
        } else {
          console.warn('Webhook: No userId in session metadata:', session.metadata)
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any
        console.log('Webhook: Processing payment_intent.succeeded for payment:', paymentIntent.id)
        
        // Handle successful payment
        if (paymentIntent.metadata?.userId) {
          console.log('Webhook: Marking user as paid from payment intent:', paymentIntent.metadata.userId)
          await TrialManager.markAsPaid(
            paymentIntent.metadata.userId,
            paymentIntent.id,
            paymentIntent.amount
          )
          console.log('Webhook: Successfully marked user as paid from payment intent')
        } else {
          console.warn('Webhook: No userId in payment intent metadata:', paymentIntent.metadata)
        }
        break

      default:
        console.log(`Webhook: Unhandled event type: ${event?.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook: Handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
} 