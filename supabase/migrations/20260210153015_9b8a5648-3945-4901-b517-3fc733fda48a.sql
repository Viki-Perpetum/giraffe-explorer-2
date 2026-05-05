
-- 1. User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks (avoids RLS recursion)
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

-- RLS: admins can see all roles, users can see their own
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. App requests table (submitted by users, reviewed by admins)
CREATE TABLE public.app_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem text NOT NULL,
  department text,
  urgency text NOT NULL DEFAULT 'Medium',
  existing_tools text,
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

-- 3. Apps catalog table (managed by admins)
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

-- Anyone authenticated can read apps
CREATE POLICY "Authenticated users can view apps"
  ON public.apps FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage apps
CREATE POLICY "Admins can manage apps"
  ON public.apps FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the apps table with existing static data
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
