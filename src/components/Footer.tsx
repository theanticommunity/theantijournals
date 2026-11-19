import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/archive', label: 'Archive' },
  { href: '/about', label: 'About' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
];

const NEWSLETTER_LINKS = [
  { href: '/newsletter', label: 'Newsletter' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-12">
          <div className="col-span-2 md:col-span-1">
            <div className="masthead mb-2">AntiJournals</div>
            <div className="masthead-sub mb-6">Independent publication</div>
            <p className="text-secondary-grey text-sm leading-relaxed">
              Writing on humanity, society, morality, and the things rarely said out loud.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey mb-6">
              Publication
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-black hover:text-secondary-grey transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey mb-6">
              Account
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/login"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey mb-6">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/privacy-policy.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/dmca"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  DMCA / Copyright
                </a>
              </li>
              <li>
                <a
                  href="/accessibility"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  Accessibility
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-sans font-medium tracking-widest uppercase text-secondary-grey mb-6">
              Connect
            </h3>
            <ul className="space-y-3">
              {NEWSLETTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-black hover:text-secondary-grey transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="mailto:theanticommunity101@gmail.com"
                  className="text-sm text-black hover:text-secondary-grey transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black/10 pt-8 pb-12">
          <p className="text-xs text-secondary-grey">
            {year} AntiJournals under AntiPerson. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;