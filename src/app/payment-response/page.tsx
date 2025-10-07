'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, FileText } from 'lucide-react'

export default function PaymentResponsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'success' | 'failed' | 'loading'>('loading')

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    const handlePaymentResponse = async () => {
      if (success === 'true') {
        setStatus('success')
        // Payment confirmation is handled by webhook
        // Set payment completed in localStorage for immediate UI feedback
        localStorage.setItem('paymentCompleted', 'true')
      } else if (canceled === 'true') {
        setStatus('failed')
      } else {
        setStatus('failed')
      }
    }

    handlePaymentResponse()
  }, [searchParams])

  const handleNextSteps = () => {
    router.push('/portal')
  }

  const handleTryAgain = () => {
    router.push('/payment')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Processing payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full">
        {status === 'success' ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-900/20 border border-green-600/30 rounded-full p-4">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-bold"
              style={{color: 'var(--text-primary)'}}
              >Payment Successful!</h1>
              <p className="text-sm"
              style={{color: 'var(--text-secondary)'}}
              >
                Thank you for your payment. You now have access to your client portal.
              </p>
            </div>

            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-green-400" />
                <div className="text-left">
                  <p className="text-green-400 font-medium text-sm">What&apos;s Next?</p>
                  <p className="text-xs"
                  style={{color: 'var(--text-secondary)'}}
                  >
                    Now you can access your profile & connect with digits for accounting.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleNextSteps}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors border"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <span>Go to Portal</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-red-900/20 border border-red-600/30 rounded-full p-4">
                <XCircle className="h-12 w-12 text-red-400" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl font-bold"
                style={{color: 'var(--text-primary)'}}
              >Payment Failed</h1>
              <p className="text-sm"
              style={{color: 'var(--text-secondary)'}}
              >
                We couldn&apos;t process your payment. Please try again or contact support if the problem persists.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <div className="text-left">
                  <p className="text-red-400 font-medium text-sm">Common Issues</p>
                  <p className="text-xs"
                  style={{color: 'var(--text-secondary)'}}>
                    • Check your card details<br/>
                    • Ensure sufficient funds<br/>
                    • Try a different payment method
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTryAgain}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <span>Try Again</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors border"
                style={{
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}