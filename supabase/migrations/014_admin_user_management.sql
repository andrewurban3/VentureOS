-- Admin: allow admins to view and update all profiles, seed andrewurban3@gmail.com as admin

-- Helper: check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: allow users to see/update own, admins to see/update all
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_all ON profiles;
CREATE POLICY profiles_select_all ON profiles FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_update_all ON profiles;
CREATE POLICY profiles_update_all ON profiles FOR UPDATE USING (
  user_id = auth.uid() OR public.is_admin()
);

-- Seed andrewurban3@gmail.com as venture-lead (017 consolidates admin into venture-lead; use venture-lead for idempotency)
UPDATE public.profiles
SET role = 'venture-lead', updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'andrewurban3@gmail.com' LIMIT 1);
