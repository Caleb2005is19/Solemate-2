import React from 'react';

export function TermsOfService() {
  return (
    <div className="bg-zinc-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 sm:p-12">
        <h1 className="text-3xl sm:text-4xl font-sans font-bold text-zinc-900 tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-500 mb-8 font-mono">
          Last updated: June 12, 2026
        </p>

        <div className="prose prose-zinc max-w-none text-zinc-600 space-y-6 leading-relaxed">
          <p>
            Welcome to <strong>Solemate.co.ke</strong>. By accessing our platform, logging in with Google verification, 
            or placing orders for any of our premium authentic sneakers, you agree to comply with and be bound by 
            the following terms and conditions. Please read them carefully.
          </p>

          <hr className="border-zinc-200 my-8" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              1. Platform Usage & Accounts
            </h2>
            <p>
              Users must be at least 18 years old or under guardian supervision to proceed with purchases. 
              By signing in through Google OAuth, you represent that your account credentials are kept secure and that 
              you are fully responsible for all actions taken under your digital identity.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              2. Products, Pricing, and Stock availability
            </h2>
            <p>
              Our stock consists of highly sought-after authentic footwear. While we strive to display sizing, pricing, 
              and images accurately:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Stock status and availability count are subject to change instantly as orders are processed.</li>
              <li>Pricing specified is in Kenyan Shillings (KES) unless configured otherwise. We reserve the right to modify prices or discontinue collections without prior notice.</li>
              <li>Size listings match local distributions. Buyers are requested to double-check their choices before proceeding to pay.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              3. Payments & Gateway Policy
            </h2>
            <p>
              We prioritize transaction safety for our clients. All local payments are processed through integrated secure channels 
              (M-Pesa STK Push via IntaSend gateways):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>When requesting an M-Pesa push, clients must enter their PIN on their mobile device immediately to complete authorization.</li>
              <li>Automated payment state checks verify whether the request succeeded directly from the gateway API. Attempting to bypass verification, spoofing invoice codes, or logging fraudulent claims will lead to instant account suspension.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              4. Deliveries and Returns
            </h2>
            <p>
              Deliveries within Nairobi and wider Kenya are scheduled promptly after transaction confirmation based on the delivery fee selected at checkout. 
              Refund or exchange claims can only be raised for factory defects or shipment mismatches of the original ordered shoe, and must be returned 
              with all initial tags, branded boxes, and seals intact.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 font-sans">
              5. Governing Law and Amendments
            </h2>
            <p>
              These Terms of Service shall be governed by and constructed in accordance with the Laws of the Republic of Kenya. 
              We reserve the right to revise or update these conditions periodicially. Your continued interaction with the platform 
              constitutes ongoing agreement to all modified regulations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
