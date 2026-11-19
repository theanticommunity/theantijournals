-- Migration 004: Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Profiles: users can read own profile, admins can read all
-- ============================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Categories: public read, admin write
-- ============================================
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Tags: public read, admin write
-- ============================================
CREATE POLICY "Public can view tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Publications: public read free/published, authenticated read entitled, admin write
-- ============================================
CREATE POLICY "Public can view published free publications" ON public.publications
  FOR SELECT USING (
    status = 'published'
    AND access_classification = 'free'
  );

CREATE POLICY "Authenticated can view entitled publications" ON public.publications
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND status = 'published'
    AND (
      access_classification = 'free'
      OR EXISTS (
        SELECT 1 FROM public.entitlements e
        WHERE e.user_id = auth.uid()
          AND e.revoked_at IS NULL
          AND (e.expires_at IS NULL OR e.expires_at > NOW())
          AND (
            (e.type = 'publication_purchase' AND e.target_id = publications.id)
            OR (e.type = 'collection_purchase' AND e.target_id IN (
              SELECT collection_id FROM public.collection_items WHERE publication_id = publications.id
            ))
            OR (e.type = 'admin_assigned' AND e.target_id = publications.id)
            OR (e.type = 'promotional' AND e.target_id = publications.id)
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.entitlements e
        JOIN public.subscriptions s ON s.user_id = auth.uid() AND s.plan_id = e.target_id
        WHERE e.user_id = auth.uid()
          AND e.type = 'subscription'
          AND e.target_type = 'plan'
          AND e.revoked_at IS NULL
          AND (e.expires_at IS NULL OR e.expires_at > NOW())
          AND s.status = 'active'
          AND s.current_period_end > NOW()
          AND access_classification IN ('free', 'paid_individual', 'subscriber_exclusive')
      )
    )
  );

CREATE POLICY "Admins can manage publications" ON public.publications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Publication-Category: public read, admin write
-- ============================================
CREATE POLICY "Public can view publication categories" ON public.publication_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage publication categories" ON public.publication_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Publication-Tag: public read, admin write
-- ============================================
CREATE POLICY "Public can view publication tags" ON public.publication_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage publication tags" ON public.publication_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Newsletter subscribers: public insert, admin read only
-- ============================================
CREATE POLICY "Public can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view newsletter subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Bookmarks: authenticated users manage own bookmarks
-- ============================================
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Analytics events: public insert, admin read
-- ============================================
CREATE POLICY "Public can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view analytics events" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Settings: public read, admin write
-- ============================================
CREATE POLICY "Public can view settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Collections: public read published, admin write
-- ============================================
CREATE POLICY "Public can view published collections" ON public.collections
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage collections" ON public.collections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Collection items: public read, admin write
-- ============================================
CREATE POLICY "Public can view collection items" ON public.collection_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage collection items" ON public.collection_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Products: public read active, admin write
-- ============================================
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Subscription plans: public read active, admin write
-- ============================================
CREATE POLICY "Public can view active subscription plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Payments: users view own payments, admins view all, service role inserts
-- ============================================
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Subscriptions: users view own, admins view all
-- ============================================
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Entitlements: users view own, admins manage all
-- ============================================
CREATE POLICY "Users can view own entitlements" ON public.entitlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage entitlements" ON public.entitlements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Audit log: admins read only
-- ============================================
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
