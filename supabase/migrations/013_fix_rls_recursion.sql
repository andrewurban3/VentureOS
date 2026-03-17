-- Fix infinite recursion in RLS policies for relation "profiles"
-- The ventures policies used EXISTS (SELECT 1 FROM profiles ...) which triggered
-- profiles RLS, causing recursive policy evaluation. Use a SECURITY DEFINER
-- function to bypass RLS when checking roles.

-- Helper: check if current user has venture-lead or admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_venture_lead_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('venture-lead', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop redundant allow_all policies on ventures (from 001/combined migrations)
DROP POLICY IF EXISTS allow_all_select_ventures ON ventures;
DROP POLICY IF EXISTS allow_all_insert_ventures ON ventures;
DROP POLICY IF EXISTS allow_all_update_ventures ON ventures;
DROP POLICY IF EXISTS allow_all_delete_ventures ON ventures;

-- Recreate ventures policies using the helper (no inline profiles subquery)
DROP POLICY IF EXISTS ventures_select_policy ON ventures;
CREATE POLICY ventures_select_policy ON ventures FOR SELECT USING (
  founder_user_id IS NULL
  OR founder_user_id = auth.uid()
  OR public.is_venture_lead_or_admin()
);

DROP POLICY IF EXISTS ventures_insert_policy ON ventures;
CREATE POLICY ventures_insert_policy ON ventures FOR INSERT WITH CHECK (
  founder_user_id IS NULL OR founder_user_id = auth.uid()
  OR public.is_venture_lead_or_admin()
);

DROP POLICY IF EXISTS ventures_update_policy ON ventures;
CREATE POLICY ventures_update_policy ON ventures FOR UPDATE USING (
  founder_user_id IS NULL OR founder_user_id = auth.uid()
  OR public.is_venture_lead_or_admin()
);

DROP POLICY IF EXISTS ventures_delete_policy ON ventures;
CREATE POLICY ventures_delete_policy ON ventures FOR DELETE USING (
  founder_user_id IS NULL OR founder_user_id = auth.uid()
  OR public.is_venture_lead_or_admin()
);
