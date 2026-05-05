
ALTER TABLE public.app_requests
  ADD COLUMN IF NOT EXISTS app_name text,
  ADD COLUMN IF NOT EXISTS expected_users text,
  ADD COLUMN IF NOT EXISTS desired_timeline text,
  ADD COLUMN IF NOT EXISTS integrations text,
  ADD COLUMN IF NOT EXISTS additional_context text;
