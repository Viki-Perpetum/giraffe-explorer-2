-- ============================================
-- PERPETUM TEMPLATE — BASE SCHEMA
-- Shared auth & access tables for all apps
-- ============================================

-- ======================
-- ENUM TYPES
-- ======================
CREATE TYPE public.app_role AS ENUM (
  'global_admin',
  'team_manager',
  'viewer',
  'user'
);

-- ======================
-- PROFILES TABLE (linked to auth.users)
-- ======================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  entra_object_id TEXT UNIQUE,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ======================
-- USER ROLES TABLE (for app permissions)
-- ======================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ======================
-- APP ACCESS TABLE (per-app authorization)
-- ======================
CREATE TABLE public.app_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  app_slug TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, app_slug)
);

-- ======================
-- AUDIT EVENTS
-- ======================
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id),
  actor_email TEXT,
  actor_ip_address INET,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  old_value JSONB,
  new_value JSONB,
  change_summary TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================
-- INDEXES
-- ======================
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_actor ON public.audit_events(actor_user_id);
CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_app_access_user ON public.app_access(user_id);
CREATE INDEX idx_app_access_slug ON public.app_access(app_slug);

-- ======================
-- HELPER FUNCTIONS
-- ======================
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_app_access(_user_id UUID, _app_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_access
    WHERE user_id = _user_id
      AND app_slug = _app_slug
      AND (expires_at IS NULL OR expires_at > now())
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'global_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_app_role(_user_id UUID, _app_slug TEXT)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.app_access
  WHERE user_id = _user_id
    AND app_slug = _app_slug
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1
$$;

-- ======================
-- ENABLE ROW LEVEL SECURITY
-- ======================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- ======================
-- RLS POLICIES
-- ======================

-- Profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User Roles
CREATE POLICY "Anyone can view user roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Global admins can manage user roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_app_role(auth.uid(), 'global_admin'));

-- App Access
CREATE POLICY "Users can view own app access" ON public.app_access
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Global admins can manage all app access" ON public.app_access
  FOR ALL TO authenticated USING (public.has_app_role(auth.uid(), 'global_admin'));

-- Audit Events
CREATE POLICY "Anyone can view audit events" ON public.audit_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert audit events" ON public.audit_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- ======================
-- TRIGGER FOR PROFILE CREATION ON SIGNUP
-- ======================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ======================
-- TRIGGER FOR UPDATED_AT
-- ======================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
