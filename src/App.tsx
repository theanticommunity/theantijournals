import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from './components/Layout';
import { Homepage } from './pages/Homepage';
import { Archive } from './pages/Archive';
import { ArticlePage } from './pages/ArticlePage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MembershipPage } from './pages/MembershipPage';
import { NewsletterPage } from './pages/NewsletterPage';
import { AuthProvider } from './context/AuthContext.tsx';
import { AnalyticsProvider } from './context/AnalyticsContext.tsx';
import { CookieConsentProvider } from './components/CookieConsent';
import { DMCAPage } from './pages/DMCAPage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { AccountPage } from './pages/AccountPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <HelmetProvider>
          <AnalyticsProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Homepage />} />
                <Route path="archive" element={<Archive />} />
                <Route path="articles/:slug" element={<ArticlePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="membership" element={<MembershipPage />} />
                <Route path="newsletter" element={<NewsletterPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="payment-success" element={<PaymentSuccessPage />} />
                <Route path="terms" element={<TermsOfServicePage />} />
                <Route path="privacy" element={<PrivacyPolicyPage />} />
                <Route path="dmca" element={<DMCAPage />} />
                <Route path="accessibility" element={<AccessibilityPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            </BrowserRouter>
          </AnalyticsProvider>
        </HelmetProvider>
      </AuthProvider>
    </CookieConsentProvider>
  );
}

export default App;
