export function PrivacyPolicyPage() {
  return (
    <div className="bg-white">
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="masthead mb-2">AntiJournals</div>
          <div className="masthead-sub mb-10">Privacy Policy</div>

          <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-12">
            Privacy Policy
          </h1>

          <p className="text-secondary-grey text-sm mb-6">
            Last updated: November 19, 2026
          </p>

          <div className="article-body font-serif text-lg leading-relaxed space-y-6">
            <p>
              AntiJournals (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), published under AntiPerson, operates the AntiJournals
              publication platform. We are committed to protecting your privacy. This Privacy Policy explains what
              personal information we collect, how we use it, the legal basis for that use, and your rights
              regarding that information.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">1. Data Controller</h2>
            <p>
              AntiJournals under AntiPerson is the data controller of your personal data. You may contact us at
              theanticommunity101@gmail.com with any questions about this policy or your data.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-serif text-black mb-2">Information you provide directly</h3>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li><strong>Account information:</strong> When you register, we collect your email address, full name, and password (managed by our authentication provider).</li>
              <li><strong>Payment information:</strong> When you make a purchase or subscribe, payment details are handled by Paystack. We do not store your credit card number. Paystack provides us with a transaction reference and payment status only.</li>
              <li><strong>Profile information:</strong> You may optionally provide a biography or avatar image.</li>
              <li><strong>Newsletter:</strong> Your email address when you subscribe to our newsletter.</li>
            </ul>

            <h3 className="text-xl font-serif text-black mb-2">Information collected automatically</h3>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li><strong>Usage data:</strong> We collect your IP address, browser type, pages visited, and referring URL for analytics and security purposes, only with your cookie consent.</li>
              <li><strong>Cookies:</strong> We use essential cookies for session management and, with your consent, analytics cookies for site preferences and usage measurement.</li>
            </ul>

            <h3 className="text-xl font-serif text-black mb-2">Third-party services</h3>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li><strong>Authentication provider:</strong> Hosts our database and authentication. Your email and encrypted password are stored by the provider.</li>
              <li><strong>Paystack:</strong> Processes all payments. Your payment details are handled entirely by Paystack.</li>
              <li><strong>Firebase Hosting:</strong> Serves the static frontend. No personal data is stored by Firebase beyond standard hosting logs.</li>
            </ul>

            <h2 className="text-2xl font-serif text-black mb-4">3. How We Use Your Information and Legal Basis</h2>
            <table className="w-full text-sm text-secondary-grey border-collapse mb-6">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left pb-2 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Purpose</th>
                  <th className="text-left pb-2 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Data used</th>
                  <th className="text-left pb-2 text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey">Legal basis</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/5">
                  <td className="py-2 font-serif">Account creation and management</td>
                  <td className="py-2">Email, name, password</td>
                  <td className="py-2">Contract (Art. 6(1)(b) GDPR)</td>
                </tr>
                <tr className="border-b border-black/5">
                  <td className="py-2 font-serif">Payment processing</td>
                  <td className="py-2">Transaction reference, payment status</td>
                  <td className="py-2">Contract (Art. 6(1)(b) GDPR)</td>
                </tr>
                <tr className="border-b border-black/5">
                  <td className="py-2 font-serif">Newsletter delivery</td>
                  <td className="py-2">Email address</td>
                  <td className="py-2">Consent (Art. 6(1)(a) GDPR)</td>
                </tr>
                <tr className="border-b border-black/5">
                  <td className="py-2 font-serif">Analytics and security</td>
                  <td className="py-2">IP address, browser, pages visited</td>
                  <td className="py-2">Consent (Art. 6(1)(a) GDPR) — via cookie banner</td>
                </tr>
                <tr className="border-b border-black/5">
                  <td className="py-2 font-serif">Legal compliance and fraud prevention</td>
                  <td className="py-2">Account and payment records</td>
                  <td className="py-2">Legal obligation / legitimate interest (Art. 6(1)(c) and (f) GDPR)</td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-2xl font-serif text-black mb-4">4. Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We share data only with:
            </p>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li><strong>Paystack</strong> — for payment processing</li>
              <li><strong>Authentication provider</strong> — for authentication and account hosting</li>
              <li><strong>Legal requirements</strong> — if required by law or to protect rights</li>
            </ul>

            <h2 className="text-2xl font-serif text-black mb-4">5. International Transfers</h2>
            <p>
              Our service providers are located in various jurisdictions. Where your data is transferred outside
              the European Union, we rely on standard contractual clauses or an adequacy decision to ensure an
              adequate level of protection.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">6. Your Rights</h2>
            <p>
              You may:
            </p>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li>Access, correct, or delete your personal data</li>
              <li>Withdraw consent for marketing emails at any time</li>
              <li>Export your data</li>
              <li>Object to processing based on legitimate interest</li>
              <li>Close your account (which deletes your personal data)</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p>
              To exercise these rights, contact us at theanticommunity101@gmail.com.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">7. Data Retention</h2>
            <p>
              We retain account data as long as your account is active. Payment records are retained for
              accounting and dispute resolution purposes. Analytics data is retained for 12 months and then
              deleted. You may request deletion of your data at any time.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">8. Security</h2>
            <p>
              We use industry-standard encryption (HTTPS/TLS) for data in transit. Passwords are hashed by our
              authentication provider. We do not store payment card details. Access to personal data is restricted
              to authorized personnel.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">9. Data Breach Notification</h2>
            <p>
              In the event of a personal data breach that is likely to result in a risk to your rights and
              freedoms, we will notify the relevant supervisory authority without undue delay, and in any case
              within 72 hours of becoming aware of the breach. Where the breach is likely to result in a high risk
              to you, we will also notify you directly without undue delay.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">10. Children&rsquo;s Privacy</h2>
            <p>
              The Site is not intended for children under 13. We do not knowingly collect personal information
              from children under 13. If we become aware that we have collected personal information from a child
              under 13, we will delete it promptly.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy. Changes are effective when posted on the Site. We will notify you
              of material changes by email or via a prominent notice on the Site.
            </p>

            <p className="text-secondary-grey text-sm mt-12">
              Questions about this policy can be directed to theanticommunity101@gmail.com.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPolicyPage;
