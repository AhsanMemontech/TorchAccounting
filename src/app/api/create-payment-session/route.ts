import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRODUCT_CONFIG } from '@/lib/stripe'
import { TrialManager } from '@/lib/trialManager'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe secret key is available
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured')
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    const { userId } = await request.json()

    // Check if user is in trial and has access
    if (userId) {
      const hasAccess = await TrialManager.hasAccess(userId)
      if (hasAccess) {
        // User has paid
        return NextResponse.json({ 
          redirectTo: '/',
          message: 'Already Paid'
        })
      }
    }

    // Create metadata object with user ID for webhook handling
    const metadata = {
      hasFormData: 'true',
      timestamp: new Date().toISOString(),
      userId: userId || '',
    }

    // Create Stripe checkout session
    const session = await stripe?.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: PRODUCT_CONFIG.currency,
            product_data: {
              name: PRODUCT_CONFIG.name,
              description: PRODUCT_CONFIG.description,
            },
            unit_amount: PRODUCT_CONFIG.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/payment-response?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/payment-response?canceled=true`,
      metadata,
    })

    return NextResponse.json({ sessionId: session?.id })
  } catch (error) {
    console.error('Error creating payment session:', error)
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
} 