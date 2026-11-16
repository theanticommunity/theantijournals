import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { AuthProvider } from './context/AuthContext';
import { AnalyticsProvider } from './context/AnalyticsContext.tsx';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminArticles } from './pages/AdminArticles';
import { AdminArticleEditor } from './pages/AdminArticleEditor';
import { AccountPage } from './pages/AccountPage';
import { AdminCategories } from './pages/AdminCategories';
import { AdminTags } from './pages/AdminTags';
import { useAuth } from '@/context/useAuth';

function AdminRequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return null;
}

function App() {
  return (
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
            </Route>

            <Route
              path="/admin"
              element={
                <>
                  <AdminRequireAuth />
                  <AdminLayout />
                </>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="articles" element={<AdminArticles />} />
              <Route path="articles/new" element={<AdminArticleEditor />} />
              <Route path="articles/:id" element={<AdminArticleEditor />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="tags" element={<AdminTags />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AnalyticsProvider>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
