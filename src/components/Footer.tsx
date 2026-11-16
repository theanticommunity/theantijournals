import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/archive', label: 'Archive' },
  { href: '/about', label: 'About' },
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
            <div className="masthead mb-2">AntiPerson</div>
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
                  href="mailto:hello@antiperson.example"
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
            {year} AntiPerson. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;