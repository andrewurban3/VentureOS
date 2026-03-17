-- Remove all auth-dependent RLS. Allow anonymous access to profiles and ventures.

-- Drop auth-related triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_admin_user_ids_trigger ON profiles;
DROP TRIGGER IF EXISTS sync_venture_lead_user_ids_trigger ON profiles;

-- Drop auth-related functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_venture_lead_or_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_profile() CASCADE;
DROP FUNCTION IF EXISTS public.sync_admin_user_ids() CASCADE;
DROP FUNCTION IF EXISTS public.sync_venture_lead_user_ids() CASCADE;

-- Drop auth lookup tables
DROP TABLE IF EXISTS public.venture_lead_user_ids CASCADE;
DROP TABLE IF EXISTS public.admin_user_ids CASCADE;

-- Profiles: drop all policies, add permissive
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_all ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_update_all ON profiles;
DROP POLICY IF EXISTS profiles_allow_all_select ON profiles;
DROP POLICY IF EXISTS profiles_allow_all_update ON profiles;
DROP POLICY IF EXISTS profiles_allow_all_insert ON profiles;
CREATE POLICY profiles_allow_all_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_allow_all_update ON profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY profiles_allow_all_insert ON profiles FOR INSERT WITH CHECK (true);

-- Ventures: drop all policies, add permissive
DROP POLICY IF EXISTS ventures_select_policy ON ventures;
DROP POLICY IF EXISTS ventures_insert_policy ON ventures;
DROP POLICY IF EXISTS ventures_update_policy ON ventures;
DROP POLICY IF EXISTS ventures_delete_policy ON ventures;
DROP POLICY IF EXISTS allow_all_select_ventures ON ventures;
DROP POLICY IF EXISTS allow_all_insert_ventures ON ventures;
DROP POLICY IF EXISTS allow_all_update_ventures ON ventures;
DROP POLICY IF EXISTS allow_all_delete_ventures ON ventures;
DROP POLICY IF EXISTS ventures_allow_all_select ON ventures;
DROP POLICY IF EXISTS ventures_allow_all_insert ON ventures;
DROP POLICY IF EXISTS ventures_allow_all_update ON ventures;
DROP POLICY IF EXISTS ventures_allow_all_delete ON ventures;
CREATE POLICY ventures_allow_all_select ON ventures FOR SELECT USING (true);
CREATE POLICY ventures_allow_all_insert ON ventures FOR INSERT WITH CHECK (true);
CREATE POLICY ventures_allow_all_update ON ventures FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY ventures_allow_all_delete ON ventures FOR DELETE USING (true);
