import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="bg-zinc-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-sans font-bold text-zinc-900 tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-500 mb-8 font-mono">
          Last updated: June 12, 2026
        </p>

        <div className="prose prose-zinc max-w-none text-zinc-600 space-y-6 leading-relaxed">
          <p>
            At <strong>Solemate.co.ke</strong>, we value your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website, 
            purchase our product offerings, or use our authentication systems.
          </p>

          <hr className="border-zinc-200 my-8" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide directly to us to facilitate order fulfillment and personalized service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Identity and Profile Information:</strong> When you sign in with Google or create an account, 
                we collect your name, email address, profile picture URL, and system identifiers.
              </li>
              <li>
                <strong>Shipping and Billing Information:</strong> Your physical location, city/town, phone number, and delivery preferences used when placing orders.
              </li>
              <li>
                <strong>Payment Information:</strong> Transaction details coupled with M-Pesa and IntaSend gateway confirmations. 
                *Note: We never directly store highly sensitive credit card details or PINs on our servers.*
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              2. How We Use Your Information
            </h2>
            <p>
              Your information is utilized solely to provide, support, and enhance our services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To register and authenticate your user account securely via Firebase Auth.</li>
              <li>To deliver orders, manage shipments, and update payment statuses of footwears purchased.</li>
              <li>To notify you about delivery updates and crucial security alerts.</li>
              <li>To back up transaction logs in secure databases and optionally synchronize transaction reports to selected channels with your explicit consent.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              3. Data Retention and Sharing
            </h2>
            <p>
              We retain personal data only for as long as necessary to complete service delivery and fulfill auditing/compliance targets. 
              We do not sell, rent, or trade your personal information to third-party advertisers. 
              We share data only with authorized processors necessary for core services (e.g., Google Firebase for database storage, Safaricom/IntaSend for payment routing).
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              4. Security Measures
            </h2>
            <p>
              We utilize production-grade security frameworks, SSL/TLS data encryption, and Firebase secure rules 
              to keep unauthorized parties from accessing your profile or transaction details. However, please remember 
              that no internet transmission method can guarantee 100% security.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              5. Contact Us
            </h2>
            <p>
              Should you have questions about this privacy statement, or wish to request data deletion/export, please get in touch:
            </p>
            <ul className="list-none space-y-1 font-mono text-sm bg-zinc-100 p-4 rounded-xl border border-zinc-200 w-fit">
              <li>Email: hello@solemate.co.ke</li>
              <li>Nairobi CBD, Kenya</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
