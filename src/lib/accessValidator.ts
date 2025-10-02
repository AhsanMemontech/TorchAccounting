import { supabase } from './supabaseClient'
import { TrialManager } from './trialManager'

export interface AccessValidationResult {
  hasAccess: boolean
  redirectTo?: string
  message?: string
  requiresFormData?: boolean
  requiresPayment?: boolean
  requiresAuth?: boolean
}

export class AccessValidator {
  /**
   * Validates if user can access a specific route
   */
  static async validateRouteAccess(route: string): Promise<AccessValidationResult> {
    try {
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          hasAccess: false,
          redirectTo: '/',
          message: 'Authentication required',
          requiresAuth: true
        }
      }

      return {
        hasAccess: true
      }
    } catch (error) {
      console.error('Access validation error:', error)
      return {
        hasAccess: false,
        redirectTo: '/',
        message: 'Authentication error'
      }
    }
  }

  /**
   * Validates if user can proceed to payment page
   */
  static async validatePaymentAccess(): Promise<AccessValidationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          hasAccess: false,
          redirectTo: '/',
          message: 'Authentication required'
        }
      }

      return {
        hasAccess: true
      }
    } catch (error) {
      console.error('Payment access validation error:', error)
      return {
        hasAccess: false,
        redirectTo: '/',
        message: 'Authentication error'
      }
    }
  }

  /**
   * Validates if user can access form generation
   */
  static async validateFormGenerationAccess(): Promise<AccessValidationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          hasAccess: false,
          redirectTo: '/',
          message: 'Authentication required'
        }
      }

      // Check if user has access (trial or paid)
      // const hasAccess = await TrialManager.hasAccess(user.id)
      // if (!hasAccess) {
      //   return {
      //     hasAccess: false,
      //     redirectTo: '/payment',
      //     message: 'Payment or trial required'
      //   }
      // }

      return {
        hasAccess: true,
      }
    } catch (error) {
      console.error('Form generation access validation error:', error)
      return {
        hasAccess: false,
        redirectTo: '/',
        message: 'Authentication error'
      }
    }
  }

  /**
   * Validates if user can access next steps
   */
  static async validateNextStepsAccess(): Promise<AccessValidationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          hasAccess: false,
          redirectTo: '/',
          message: 'Authentication required'
        }
      }

      // Check if user has access (trial or paid)
      // const hasAccess = await TrialManager.hasAccess(user.id)
      
      // if (!hasAccess) {
      //   return {
      //     hasAccess: false,
      //     redirectTo: '/payment',
      //     message: 'Payment or trial required'
      //   }
      // }

      return {
        hasAccess: true
      }
    } catch (error) {
      console.error('Next steps access validation error:', error)
      return {
        hasAccess: false,
        redirectTo: '/login',
        message: 'Authentication error'
      }
    }
  }

  /**
   * Validates if user can access information collection
   */
  static async validateInformationCollectionAccess(): Promise<AccessValidationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          hasAccess: false,
          redirectTo: '/',
          message: 'Authentication required'
        }
      }

      return {
        hasAccess: true
      }
    } catch (error) {
      console.error('Information collection access validation error:', error)
      return {
        hasAccess: false,
        redirectTo: '/',
        message: 'Authentication error'
      }
    }
  }
} 