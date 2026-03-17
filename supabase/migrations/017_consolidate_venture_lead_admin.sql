-- Consolidate venture-lead and admin: one role with full capabilities.
-- Two roles only: founder, venture-lead.

-- Migrate existing admins to venture-lead
UPDATE public.profiles
SET role = 'venture-lead', updated_at = now()
WHERE role = 'admin';

-- Ensure venture_lead_user_ids has migrated users (016 populates from both)
INSERT INTO public.venture_lead_user_ids (user_id)
SELECT user_id FROM public.profiles WHERE role = 'venture-lead'
ON CONFLICT (user_id) DO NOTHING;

-- Remove admin from role CHECK constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('founder', 'venture-lead'));

-- is_venture_lead_or_admin: now just venture-lead (use venture_lead_user_ids to avoid profiles recursion)
CREATE OR REPLACE FUNCTION public.is_venture_lead_or_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venture_lead_user_ids WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Cleanup: drop old admin_user_ids if it exists (from previous 016)
DROP TABLE IF EXISTS public.admin_user_ids CASCADE;

-- Seed andrewurban3@gmail.com as venture-lead
UPDATE public.profiles
SET role = 'venture-lead', updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'andrewurban3@gmail.com' LIMIT 1);
