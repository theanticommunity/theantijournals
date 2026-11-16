import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { useState } from 'react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/tags', label: 'Tags' },
];

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-dark-grey text-white min-h-svh flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-grey border-r border-white/10 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}
        aria-label="Admin navigation"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="masthead text-lg">AntiPerson</div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-white hover:text-secondary-grey"
            aria-label="Close navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                item.href === '/admin' ? 'bg-white/5' : 'hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.label === 'Dashboard' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v1m-6 0a2 2 0 002-2h2a2 2 0 002 2v1m-6 0a2 2 0 012-2h2a2 2 0 012 2v1m0 0a2 2 0 002 2h2a2 2 0 002 2v1" />
                )}
                {item.label === 'Articles' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                )}
                {item.label === 'Categories' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 110 4h16a2 2 0 110-4H4zM4 12a2 2 0 110 4h16a2 2 0 110-4H4zM4 18a2 2 0 110 4h16a2 2 0 110-4H4z" />
                )}
                {item.label === 'Tags' && (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 4.01V7zM7 7v1m0 0v1a2 2 0 002 2h2a2 2 0 002-2m-2 2v-1m0 0V3m0 0v1a2 2 0 012 2h2a2 2 0 012-2m-2 2h-2a2 2 0 01-2-2V3m0 0v1a2 2 0 002 2h2a2 2 0 002-2m-2 2v-1M7 7h.01M17 17h.01M17 17v1a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1m0 0v-1a2 2 0 012-2h2a2 2 0 012 2v1m0 0v1a2 2 0 00-2 2h-2a2 2 0 00-2-2v-1" />
                )}
              </svg>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-grey hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        <header className="sticky top-0 z-40 bg-dark-grey border-b border-white/10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-white hover:text-secondary-grey"
                aria-label="Open navigation"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-sm font-sans font-medium tracking-widest uppercase text-white">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function getPageTitle() {
  // Simple title based on route - can be enhanced
  return 'Dashboard';
}

export default AdminLayout;
