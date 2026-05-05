
-- Create notifications table
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

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Trigger function: notify all admins when a new app request is created
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
  -- Get requester display name
  SELECT display_name INTO requester_name
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  -- Insert a notification for each admin
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
