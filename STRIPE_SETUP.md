# Stripe Payment Integration Setup

## Getting Started

1. **Create a Stripe Account**
   - Go to [stripe.com](https://stripe.com) and create an account
   - Complete the account setup process

2. **Get Your API Keys**
   - Log into your Stripe Dashboard
   - Go to Developers → API Keys
   - Copy your publishable key and secret key

3. **Configure Environment Variables**
   Create a `.env.local` file in your project root with:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

4. **Set Up Webhooks**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Enter your webhook URL: `https://yourdomain.com/api/stripe-webhook`
   - Select these events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
   - Copy the webhook signing secret and add it to your environment variables

5. **Update the Configuration**
   - Open `src/lib/stripe.ts`
   - Replace the placeholder keys with your actual test keys
   - Update the product configuration if needed

## Test Cards

Use these test card numbers for testing:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

## Features

- ✅ Secure payment processing with Stripe Checkout
- ✅ Webhook-based payment confirmation
- ✅ Test mode for development (no real charges)
- ✅ Automatic form data preservation
- ✅ Success/failure handling
- ✅ Mobile-responsive design

## Production Deployment

When ready for production:
1. **Switch to Live Keys:**
   - In Stripe Dashboard, toggle to "Live" mode
   - Copy your live publishable key and secret key
   - Update environment variables:
     ```
     STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
     STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
     ```

2. **Set Up Live Webhook:**
   - In Live mode, go to Developers → Webhooks
   - Add endpoint with your production domain
   - Copy the live webhook secret

3. **Deploy Your Application:**
   - Deploy to your production server
   - Ensure environment variables are set correctly
   - Test with real cards in test mode first

4. **Monitor Payments:**
   - Monitor payments in Stripe dashboard
   - Check webhook delivery status
   - Set up alerts for failed payments

## Security Notes

- Never commit your secret keys to version control
- Use environment variables for all sensitive data
- Webhook signatures ensure payment confirmations are legitimate
- Test thoroughly before going live
- Monitor for suspicious activity
- Keep your webhook secrets secure 