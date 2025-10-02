import Stripe from 'stripe'

// Check if Stripe secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// Initialize Stripe with environment variable

//Test
// export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
//   apiVersion: '2025-06-30.basil',
// }) : null

//Live:
 export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
   apiVersion: '2024-09-30.acacia' as any,
 }) : null

// Publishable key for client-side (safe to expose)
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

export const amount = parseInt(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_AMOUNT || "0", 10);

// Product configuration
export const PRODUCT_CONFIG = {
  name: 'Divorce Form Generation Service',
  price: amount, // $99.00 in cents
  currency: 'usd',
  description: 'Complete NY uncontested divorce form generation service with filing instructions'
} 