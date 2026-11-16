import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { SEO } from './SEO';
import { useAnalytics } from '@/context/useAnalytics';

export function Layout() {
  const location = useLocation();
  const { track } = useAnalytics();

  useEffect(() => {
    track('page_view', { path: location.pathname });
  }, [location, track]);

  return (
    <div className="min-h-svh flex flex-col bg-white">
      <SEO
        title="AntiPerson"
        description="Independent publication on humanity, society, morality, and the things rarely said out loud."
        canonical="/"
      />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
