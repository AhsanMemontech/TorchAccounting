'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CreditCard,  
  Lock, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabaseClient'
import { AccessValidator } from '@/lib/accessValidator'
import { amount } from '@/lib/stripe'

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
const amountInDollar = amount / 100;

export default function PaymentPage() {
  const router = useRouter()
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Validate access to payment page
    const validateAccess = async () => {
      try {
        const validation = await AccessValidator.validatePaymentAccess()
        
        if (!validation.hasAccess) {
          if (validation.redirectTo) {
            router.push(validation.redirectTo)
            return
          }
        }
        
        // If we have access, load user and trial data
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
        
      } catch (error) {
        console.error('Access validation error:', error)
        setError('Failed to validate access. Please try again.')
      }
    }
    
    validateAccess()
  }, [router])

  const handlePay = async () => {
    setIsPaying(true)
    setError(null)

    try {
      // Create payment session
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment session')
      }

      const responseData = await response.json()
      
      // Check if user has access (paid)
      if (responseData.redirectTo) {
        router.push(responseData.redirectTo)
        return
      }
      
      const { sessionId } = responseData
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          setError(error.message || 'Payment failed')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment failed. Please try again.')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          {/* <div className="mt-5 text-center mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Service Payment
            </h1>
          </div> */}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-1 gap-8 mb-8">

            {/* Paid Service Card */}
            <div className="rounded-xl border p-8 backdrop-blur-sm shadow-2xl h-full mx-auto" style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-secondary)' 
            }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg"
                  style={{ backgroundColor: 'var(--bg-user-logo)' }}>
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                {/* <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Full Service</h3> */}
                <div className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>${amountInDollar}</div>
                <p style={{ color: 'var(--text-muted)' }}>one-time payment</p>
              </div>

              {/* <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>All trial features included</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Lifetime access</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Priority customer support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Updates and improvements</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Secure payment processing</span>
                </div>
              </div> */}

              <button
                onClick={handlePay}
                disabled={isPaying}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                  isPaying
                    ? 'cursor-not-allowed'
                    : ''
                }`}
                style={{
                  backgroundColor: isPaying
                    ? 'var(--bg-tertiary)' 
                    : 'var(--bg-button)',
                  color: isPaying
                    ? 'var(--text-muted)' 
                    : 'white'
                }}
              >
                {isPaying ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Lock className="h-5 w-5 animate-pulse" />
                    <span>Processing Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Pay ${amountInDollar}</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-6 rounded-xl border backdrop-blur-sm shadow-2xl" style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--accent-error)' 
            }}>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6" style={{ color: 'var(--accent-error)' }} />
                <span className="font-medium" style={{ color: 'var(--accent-error)' }}>{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 