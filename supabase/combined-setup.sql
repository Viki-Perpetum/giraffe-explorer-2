-- ============================================
-- COMBINED SETUP SCRIPT FOR HOSTED SUPABASE
-- Run this in the Supabase SQL Editor
-- ============================================

-- ======================
-- Migration 1: profiles
-- ======================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ======================
-- Migration 2: user_roles, app_requests, apps + seed data
-- ======================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- App requests
CREATE TABLE public.app_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem text NOT NULL,
  department text,
  urgency text NOT NULL DEFAULT 'Medium',
  existing_tools text,
  app_name text,
  expected_users text,
  desired_timeline text,
  integrations text,
  additional_context text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.app_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON public.app_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.app_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
  ON public.app_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_requests_updated_at
  BEFORE UPDATE ON public.app_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apps catalog
CREATE TABLE public.apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'COMING SOON',
  icon_name text NOT NULL DEFAULT 'Zap',
  description text NOT NULL,
  long_description text,
  featured boolean NOT NULL DEFAULT false,
  built_with text,
  last_updated text,
  owner text,
  version text DEFAULT '—',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view apps"
  ON public.apps FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage apps"
  ON public.apps FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed apps
INSERT INTO public.apps (slug, name, domain, status, icon_name, description, long_description, featured, built_with, last_updated, owner, version) VALUES
  ('target-account-profiler', 'Target Account Profiler', 'Sales', 'LIVE', 'Crosshair', 'AI-powered company research. Input a name, get outreach intelligence in minutes.', 'The Target Account Profiler uses AI to deliver comprehensive company intelligence for your sales outreach. Simply enter a company name and receive detailed insights including key decision-makers, recent news, financial health indicators, and personalized outreach recommendations — all within minutes.', true, 'React, OpenAI API', 'Feb 5, 2026', 'Sales Enablement', '2.1.0'),
  ('rfp-screening-tool', 'RFP Screening Tool', 'Sales', 'BETA', 'ClipboardCheck', 'Screen and score incoming RFPs against PerPetum''s strategic fit criteria.', 'Automatically evaluate incoming RFPs against PerPetum''s strategic priorities, capacity, and competitive positioning. The tool assigns a fit score and highlights key risk areas to help the team decide which opportunities to pursue.', false, 'React, Scoring Engine', 'Jan 28, 2026', 'Sales Operations', '0.9.2'),
  ('proposal-generator', 'Proposal Generator', 'Sales', 'COMING SOON', 'FileText', 'Auto-generate client proposals from templates with project-specific data.', 'Streamline proposal creation by pulling project data, pricing, and team credentials into customizable templates. Reduce proposal turnaround from days to hours.', false, 'React, Document API', 'Coming Soon', 'Sales Enablement', '—'),
  ('cashflow-forecast-planner', 'Cashflow Forecast Planner', 'Finance', 'BETA', 'Wallet', 'Cross-project cashflow visualization and scenario planning.', 'Visualize cashflow across all active projects with interactive timelines and scenario modeling. Compare best-case, expected, and worst-case projections to support financial planning and board reporting.', true, 'React, Recharts', 'Feb 3, 2026', 'Finance Team', '1.2.0'),
  ('board-annotation-tracking', 'Board Annotation & Tracking Tool', 'General / Exec', 'COMING SOON', 'Pin', 'Track board decisions, action items, and follow-ups across meetings.', 'A centralized tool for tracking board-level decisions, assigning action items, and monitoring follow-up progress across quarterly and ad-hoc board meetings.', false, 'React', 'Coming Soon', 'Executive Office', '—'),
  ('nis2-access-matrix', 'NIS2 Access Matrix', 'IT Admin', 'COMING SOON', 'Lock', 'NIS2 compliance access control matrix with role mapping.', 'Map user roles to system access levels in compliance with the NIS2 directive. Identify gaps, generate audit reports, and maintain a living compliance matrix.', false, 'React', 'Coming Soon', 'IT & Compliance', '—'),
  ('it-access-management', 'IT Access Management Tool', 'IT Admin', 'BETA', 'Shield', 'Visual overview of system access rights with request workflows.', 'Get a clear visual map of who has access to what across all company systems. Submit, approve, and track access requests with built-in workflow automation.', false, 'React, RBAC Engine', 'Jan 20, 2026', 'IT Administration', '0.8.1'),
  ('competitor-monitor', 'Competitor Monitor', 'Marketing / Strategy', 'COMING SOON', 'Eye', 'Track competitor moves, customer signals, and market shifts.', 'Stay ahead of the competition with automated monitoring of competitor announcements, pricing changes, and market positioning. Receive weekly digests and real-time alerts for significant moves.', false, 'React, Web Scraping', 'Coming Soon', 'Strategy Team', '—'),
  ('revenue-model-studio', 'Revenue Model Studio', 'Engineering & Product', 'BETA', 'Zap', '20-year revenue modeling with sensitivity analysis for energy projects.', 'Build detailed 20-year revenue models for energy projects with built-in sensitivity analysis, tariff scenario comparison, and Monte Carlo simulations. Export results for board presentations and investor decks.', true, 'React, Financial Engine', 'Feb 1, 2026', 'Product Team', '1.0.3');

-- ======================
-- Migration 3: additional admin policies
-- ======================
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete requests"
  ON public.app_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete apps"
  ON public.apps FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ======================
-- Migration 5: notifications
-- ======================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger: notify admins on new app request
CREATE OR REPLACE FUNCTION public.notify_admins_on_request()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  requester_name TEXT;
BEGIN
  SELECT display_name INTO requester_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      admin_record.user_id,
      'New App Request',
      COALESCE(requester_name, 'A user') || ' submitted a new app request: "' || LEFT(NEW.problem, 80) || '"',
      '/admin/requests'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_app_request
  AFTER INSERT ON public.app_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_request();

-- ======================
-- Migration 7: enable realtime for notifications
-- ======================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
