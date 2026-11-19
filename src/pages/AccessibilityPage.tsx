export function AccessibilityPage() {
  return (
    <div className="bg-white">
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="masthead mb-2">AntiJournals</div>
          <div className="masthead-sub mb-10">Accessibility Statement</div>

          <h1 className="text-balance text-4xl md:text-5xl font-serif text-black leading-tight mb-12">
            Accessibility Statement
          </h1>

          <p className="text-secondary-grey text-sm mb-6">
            Last updated: November 19, 2026
          </p>

          <div className="article-body font-serif text-lg leading-relaxed space-y-6">
            <p>
              AntiJournals under AntiPerson is committed to making our publication accessible to everyone, including people with
              disabilities. We are continually improving the user experience for everyone and applying the relevant
              accessibility standards.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">Conformance Status</h2>
            <p>
              The Web Content Accessibility Guidelines (WCAG) define requirements for designers and developers to
              improve accessibility for people with disabilities. It defines three levels of conformance: Level A,
              Level AA, and Level AAA.               AntiJournals under AntiPerson is <strong>partially conformant</strong> with WCAG 2.1 Level AA.
              Partially conformant means that some parts of the content do not fully conform to the accessibility
              standard.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">Accessibility Features</h2>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li>Keyboard navigation throughout the site</li>
              <li>Skip-to-content link for keyboard users</li>
              <li>Semantic HTML structure with landmarks and headings</li>
              <li>Focus-visible indicators on interactive elements</li>
              <li>Reading mode toggle (light/dark) and adjustable text size on article pages</li>
              <li>ARIA labels on interactive controls</li>
              <li>Sufficient color contrast for text and interactive elements</li>
              <li>Responsive design that works on mobile and desktop</li>
            </ul>

            <h2 className="text-2xl font-serif text-black mb-4">Known Limitations</h2>
            <p>
              Despite our best efforts, there may be some limitations. Below is a description of known limitations
              and potential solutions:
            </p>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li><strong>Third-party embedded content:</strong> Content embedded from external services may not be fully accessible. We have no control over third-party accessibility.</li>
              <li><strong>User-uploaded images:</strong> Images included in publications may not have alternative text. We encourage authors to provide descriptive alt text.</li>
            </ul>

            <h2 className="text-2xl font-serif text-black mb-4">Feedback</h2>
            <p>
              We welcome your feedback on the accessibility of AntiJournals. If you encounter accessibility
              barriers, please let us know:
            </p>
            <ul className="list-disc list-inside text-secondary-grey text-sm space-y-2 mb-6">
              <li>Email: theanticommunity101@gmail.com</li>
              <li>Subject: Accessibility feedback</li>
            </ul>
            <p>
              Please include the URL of the page, a description of the issue, and any assistive technology you are
              using. We will respond within 5 business days.
            </p>

            <h2 className="text-2xl font-serif text-black mb-4">Enforcement and Applicable Law</h2>
            <p>
              This accessibility statement applies to https://theantijournals.web.app. We aim to comply with
              applicable accessibility laws, including the Americans with Disabilities Act (ADA), the European
              Accessibility Act (EAA), and the UK Equality Act 2010, where applicable.
            </p>

            <p className="text-secondary-grey text-sm mt-12">
              Questions about this statement can be directed to theanticommunity101@gmail.com.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AccessibilityPage;
