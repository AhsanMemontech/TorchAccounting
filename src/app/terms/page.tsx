'use client'

import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-sm mb-4 transition-colors hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Terms and Conditions
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Effective Date: 28 July 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none" style={{ color: 'var(--text-primary)' }}>
          <p className="mb-6">
            Welcome to Uncouple Us (&quot;Uncouple,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of our website 
            at <a href="https://uncoupleus.com" className="underline hover:no-underline" style={{ color: 'var(--text-secondary)' }}>
            https://uncoupleus.com</a>,
             the Uncouple platform, and any related services (collectively, the &quot;Services&quot;).
          </p>
          
          <p className="mb-8">
            By using our Services, you agree to these Terms. If you do not agree, do not use our Services.
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                1. No Legal Advice – Not a Law Firm
              </h2>
              <p className="mb-3">
                Uncouple is not a law firm, not a lawyer, and does not provide legal advice. The Services are intended for informational and educational purposes only. Nothing provided by Uncouple should be interpreted as legal advice, nor does use of our Services create an attorney-client relationship.
              </p>
              <p className="mb-3">
                If you need legal advice, you should consult a licensed attorney in your jurisdiction.
              </p>
              <p>
                We do not and cannot engage in the unauthorized practice of law, and nothing in our Services should be construed as such.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                2. Eligibility
              </h2>
              <p>
                You must be at least 18 years old and legally capable of entering into contracts to use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                3. Account Registration
              </h2>
              <p>
                If you create an account, you are responsible for maintaining the confidentiality of your credentials and all activity under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                4. Subscription and Payment Terms
              </h2>
              <p className="mb-3">
                We offer subscription-based access to certain features of the Services. By subscribing, you agree to:
              </p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>Pay the applicable fees via our third-party payment processor, Stripe</li>
                <li>Provide accurate and complete billing information</li>
                <li>Authorize us to charge your chosen payment method</li>
              </ul>
              <p className="mb-3">
                If you&apos;re not fully satisfied, we offer a 100% refund within the first 30 days — no questions asked. Just submit a request via our Contact Us form.
              </p>
              <p>
                We reserve the right to change our pricing or subscription terms at any time, but we will notify you in advance of any changes that affect you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                5. User Data and Privacy
              </h2>
              <p>
                By using our Services, you consent to our collection and use of data as described in our <Link href="/privacy" className="underline hover:no-underline" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>. Please review it carefully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                6. Third-Party Tools
              </h2>
              <p className="mb-3">
                Our Services incorporate or rely on third-party platforms and APIs, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-3 space-y-1">
                <li>OpenAI for natural language responses</li>
                <li>Stripe for payment processing</li>
              </ul>
              <p>
                We do not control these services and are not responsible for their functionality, availability, or legal compliance. Use of these tools is subject to their own terms and privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                7. Disclaimers
              </h2>
              <p className="mb-3">
                We do not guarantee that our Services will be accurate, complete, uninterrupted, or error-free. All Services are provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, express or implied.
              </p>
              <p>
                We are not liable for any decisions, actions, or outcomes based on your use of the information provided through our Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                8. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, Uncouple Us LLC shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of or reliance on the Services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                9. Termination
              </h2>
              <p>
                We may suspend or terminate your access to the Services at any time, with or without cause, and without liability to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                10. Governing Law
              </h2>
              <p>
                These Terms are governed by the laws of the State of New York, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                11. Contact
              </h2>
              <p>
                If you have questions, concerns, or refund requests, please contact us at:
              </p>
              <p className="mt-2">
                <a 
                  href="mailto:support@uncoupleus.com" 
                  className="underline hover:no-underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  support@uncoupleus.com
                </a> or via our <Link href="/contact" className="underline hover:no-underline" style={{ color: 'var(--text-secondary)' }}>Contact Form</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 