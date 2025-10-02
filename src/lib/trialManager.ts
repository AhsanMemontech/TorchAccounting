import { supabase } from './supabaseClient'
import { PRODUCT_CONFIG } from './stripe'

export interface TrialStatus {
  isTrialActive: boolean
  trialStartDate: string | null
  trialEndDate: string | null
  daysRemaining: number
  hasPaid: boolean
  subscriptionType: string
}

export interface PaymentRecord {
  id: string
  userId: string
  stripeSessionId: string | null
  amount: number
  currency: string
  status: string
  paymentDate: string | null
  createdAt: string
}

export interface UserSubscription {
  subscriptionType: string
  isActive: boolean
  startDate: string
  endDate: string | null
  daysRemaining: number
}

export class TrialManager {
  /**
   * Start a 7-day trial for a new user
   */
  static async startTrial(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('start_trial_for_user', {
        p_user_id: userId
      })
      
      if (error) {
        console.error('Error starting trial:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to start trial:', error)
      throw error
    }
  }

  /**
   * Get trial status for a user
   */
  static async getTrialStatus(userId: string): Promise<TrialStatus | null> {
    try {
      const { data, error } = await supabase.rpc('get_trial_status', {
        user_id: userId
      })
      
      if (error) {
        console.error('Error getting trial status:', error)
        return null
      }
      
      if (data && data.length > 0) {
        const status = data[0]
        return {
          isTrialActive: status.is_trial_active,
          trialStartDate: status.trial_start_date,
          trialEndDate: status.trial_end_date,
          daysRemaining: status.days_remaining,
          hasPaid: status.has_paid,
          subscriptionType: status.subscription_type
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to get trial status:', error)
      return null
    }
  }

  /**
   * Check if user has access (trial active or has paid)
   */
  static async hasAccess(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('user_has_access', {
        user_id: userId
      })
      
      if (error) {
        console.error('Error checking access:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Failed to check access:', error)
      return false
    }
  }

  /**
   * Check if user is in trial period
   */
  static async isInTrial(userId: string): Promise<boolean> {
    try {
      const status = await this.getTrialStatus(userId)
      return status?.isTrialActive || false
    } catch (error) {
      console.error('Failed to check trial status:', error)
      return false
    }
  }

  /**
   * Mark user as paid
   */
  static async markAsPaid(userId: string, sessionId?: string, amount?: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('mark_user_as_paid', {
        p_user_id: userId,
        session_id: sessionId || null,
        amount: amount || PRODUCT_CONFIG.price
      })
      
      if (error) {
        console.error('Error marking user as paid:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to mark user as paid:', error)
      throw error
    }
  }

  /**
   * End trial for user
   */
  static async endTrial(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('end_trial_for_user', {
        user_id: userId
      })
      
      if (error) {
        console.error('Error ending trial:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to end trial:', error)
      throw error
    }
  }

  /**
   * Get user subscription status
   */
  static async getUserSubscriptionStatus(userId: string): Promise<UserSubscription | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_subscription_status', {
        user_id: userId
      })
      
      if (error) {
        console.error('Error getting subscription status:', error)
        return null
      }
      
      if (data && data.length > 0) {
        const status = data[0]
        return {
          subscriptionType: status.subscription_type,
          isActive: status.is_active,
          startDate: status.start_date,
          endDate: status.end_date,
          daysRemaining: status.days_remaining
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to get subscription status:', error)
      return null
    }
  }

  /**
   * Get payment history for a user
   */
  static async getPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error getting payment history:', error)
        return []
      }
      
      return data?.map(payment => ({
        id: payment.id,
        userId: payment.user_id,
        stripeSessionId: payment.stripe_session_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentDate: payment.payment_date,
        createdAt: payment.created_at
      })) || []
    } catch (error) {
      console.error('Failed to get payment history:', error)
      return []
    }
  }

  /**
   * Format trial end date for display
   */
  static formatTrialEndDate(endDate: string): string {
    return new Date(endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Get trial progress percentage
   */
  static getTrialProgress(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    
    const totalDuration = end - start
    const elapsed = now - start
    
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
    return Math.round(progress)
  }

  /**
   * Format amount from cents to dollars
   */
  static formatAmount(amountInCents: number): string {
    return `$${(amountInCents / 100).toFixed(2)}`
  }

  /**
   * Get subscription type display name
   */
  static getSubscriptionTypeDisplay(type: string): string {
    switch (type) {
      case 'trial':
        return 'Free Trial'
      case 'paid':
        return 'Paid Subscription'
      case 'expired':
        return 'Expired Trial'
      default:
        return 'Unknown'
    }
  }
} 