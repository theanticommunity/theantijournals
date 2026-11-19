import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { SEO } from './SEO';
import { ErrorBoundary } from './ErrorBoundary';
import { useAnalytics } from '@/context/useAnalytics';
import { AgeGate } from './AgeGate';

export function Layout() {
  const location = useLocation();
  const { track } = useAnalytics();

  useEffect(() => {
    track('page_view', { path: location.pathname });
  }, [location, track]);

  return (
    <div className="min-h-svh flex flex-col bg-white">
      <AgeGate>
        <a
          href="#main-content"
          className="visually-hidden focus:not-visually-hidden focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:font-sans focus:text-sm focus:uppercase focus:tracking-widest"
        >
          Skip to content
        </a>
      <SEO
        title="AntiJournals"
        description="Independent publication on humanity, society, morality, and the things rarely said out loud. AntiJournals under AntiPerson."
        canonical="/"
      />
        <Header />
        <main className="flex-1" id="main-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
      </AgeGate>
    </div>
  );
}

export default Layout;
