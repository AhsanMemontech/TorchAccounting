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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Pricing Cards */}
          <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br px-6">
            {/* Header / Description */}
            <div className="text-center max-w-xl mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                Complete Your Purchase
              </h2>
              <p className="text-lg text-gray-700">
                Secure your one-time service package today. Once your payment is
                confirmed, you&apos;ll receive instant access to your full setup and
                onboarding support.
              </p>
            </div>

            {/* Paid Service Card */}
            <div
              className="rounded-2xl border p-8 backdrop-blur-md shadow-xl w-full max-w-md transition-transform hover:scale-[1.02] hover:shadow-2xl"
              style={{
                borderColor: "rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #0b2145, #07101f)",
                  }}
                >
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-extrabold mb-2 text-gray-600">
                  ${amountInDollar}
                </div>
                <p className="text-sm text-gray-500">One-time payment</p>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  isPaying
                    ? "cursor-not-allowed bg-gray-700 text-gray-400"
                    : "bg-gradient-to-r from-[#0b2145] to-[#07101f] text-white hover:from-[#07101f] hover:to-[#0b2145]"
                }`}
              >
                {isPaying ? (
                  <>
                    <Lock className="h-5 w-5 animate-pulse" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay ${amountInDollar}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
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