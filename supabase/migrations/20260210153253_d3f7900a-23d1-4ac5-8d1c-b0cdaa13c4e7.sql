
-- Allow admins to view all profiles for user management
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete app requests
CREATE POLICY "Admins can delete requests"
  ON public.app_requests FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete apps
CREATE POLICY "Admins can delete apps"
  ON public.apps FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
