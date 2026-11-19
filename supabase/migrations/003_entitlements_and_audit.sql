-- Migration 003: Entitlements and audit log

-- Entitlements: unified access grant system
CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('publication_purchase', 'collection_purchase', 'subscription', 'admin_assigned', 'promotional')),
  target_type TEXT NOT NULL CHECK (target_type IN ('publication', 'collection', 'plan')),
  target_id UUID NOT NULL,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Audit log for administrative operations
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX idx_entitlements_target ON public.entitlements(target_type, target_id);
CREATE INDEX idx_entitlements_type ON public.entitlements(type);
CREATE INDEX idx_entitlements_revoked_at ON public.entitlements(revoked_at);
CREATE INDEX idx_entitlements_expires_at ON public.entitlements(expires_at);
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
