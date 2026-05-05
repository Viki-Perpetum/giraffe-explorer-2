
-- Tighten the insert policy: only allow inserts where user_id matches the authenticated user
-- (the trigger uses SECURITY DEFINER so it bypasses RLS)
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
