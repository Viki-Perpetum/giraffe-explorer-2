-- ============================================================================
-- App Access Control
-- Manages per-user, per-app access rights across the PerPetum platform.
-- Each app checks this table to determine if a user can access it and at what role.
-- ============================================================================

-- Extend the role enum to support richer roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'global_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'team_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'viewer';

-- App access table: who can access which app, and with what role
CREATE TABLE IF NOT EXISTS app_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_slug    TEXT NOT NULL,
  role        app_role NOT NULL DEFAULT 'user',
  granted_by  UUID REFERENCES auth.users(id),
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ,  -- NULL = never expires
  UNIQUE(user_id, app_slug)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_app_access_user ON app_access(user_id);
-- Index for fast lookups by app
CREATE INDEX IF NOT EXISTS idx_app_access_app ON app_access(app_slug);

-- Enable RLS
ALTER TABLE app_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own access rights
CREATE POLICY "Users can view own app access"
  ON app_access FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all access rights
CREATE POLICY "Admins can view all app access"
  ON app_access FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can grant/revoke access
CREATE POLICY "Admins can insert app access"
  ON app_access FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app access"
  ON app_access FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app access"
  ON app_access FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Helper function: check if a user has access to a specific app
CREATE OR REPLACE FUNCTION has_app_access(_user_id UUID, _app_slug TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_access
    WHERE user_id = _user_id
      AND app_slug = _app_slug
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Helper function: get a user's role for a specific app
CREATE OR REPLACE FUNCTION get_app_role(_user_id UUID, _app_slug TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM app_access
  WHERE user_id = _user_id
    AND app_slug = _app_slug
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Audit: log access grants/revocations
CREATE OR REPLACE FUNCTION audit_app_access_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, link)
  VALUES (
    NEW.user_id,
    'App Access Updated',
    'Your access to "' || NEW.app_slug || '" has been updated (role: ' || NEW.role || ').',
    '/'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_app_access_change
  AFTER INSERT OR UPDATE ON app_access
  FOR EACH ROW EXECUTE FUNCTION audit_app_access_change();
