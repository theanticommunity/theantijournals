import { useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/archive', label: 'Archive' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="masthead flex-shrink-0" onClick={() => setMenuOpen(false)}>
            AntiPerson
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-sans font-medium tracking-widest uppercase">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="nav-link hover:text-secondary-grey transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="/admin"
              className="nav-link hover:text-secondary-grey transition-colors"
              rel="noreferrer"
            >
              Admin
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {!user && !loading ? (
              <>
                <Link to="/login" className="nav-link">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-outline hidden sm:block"
                >
                  Join
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/account"
                  className="nav-link hover:text-secondary-grey transition-colors"
                >
                  Account
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="nav-link hover:text-secondary-grey transition-colors"
                >
                  Log out
                </button>
              </>
            )}
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 pt-4 pb-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-black hover:bg-light-grey rounded"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="/admin"
                className="block px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-black hover:bg-light-grey rounded"
                onClick={() => setMenuOpen(false)}
                rel="noreferrer"
              >
                Admin
              </a>
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-black hover:bg-light-grey rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-black border border-black text-center hover:bg-black hover:text-white mt-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    Join
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/account"
                    className="block px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-black hover:bg-light-grey rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="block w-full px-3 py-2 text-xs font-sans font-medium tracking-widest uppercase text-black hover:bg-light-grey rounded text-left"
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;