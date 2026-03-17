-- Fix profiles RLS recursion: is_admin() queried profiles, which triggered
-- profiles RLS (which calls is_admin) -> infinite recursion -> 500 error.
-- Use venture_lead_user_ids so is_admin() never touches profiles.
-- Venture lead = admin (one role with full capabilities).

-- Table for venture-lead lookup (no RLS recursion - is_admin reads this, not profiles)
CREATE TABLE IF NOT EXISTS public.venture_lead_user_ids (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Populate from existing profiles (venture-lead and admin, since we consolidate)
INSERT INTO public.venture_lead_user_ids (user_id)
SELECT user_id FROM public.profiles WHERE role IN ('venture-lead', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- Replace is_admin to read from venture_lead_user_ids (no recursion)
-- is_admin() = has elevated privileges = venture lead
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.venture_lead_user_ids WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Keep venture_lead_user_ids in sync when profiles.role changes
CREATE OR REPLACE FUNCTION public.sync_venture_lead_user_ids()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'venture-lead' THEN
      INSERT INTO public.venture_lead_user_ids (user_id) VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'venture-lead' AND NEW.role != 'venture-lead' THEN
      DELETE FROM public.venture_lead_user_ids WHERE user_id = OLD.user_id;
    ELSIF (OLD.role IS NULL OR OLD.role != 'venture-lead') AND NEW.role = 'venture-lead' THEN
      INSERT INTO public.venture_lead_user_ids (user_id) VALUES (NEW.user_id) ON CONFLICT (user_id) DO NOTHING;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.venture_lead_user_ids WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_admin_user_ids_trigger ON profiles;
DROP TRIGGER IF EXISTS sync_venture_lead_user_ids_trigger ON profiles;
CREATE TRIGGER sync_venture_lead_user_ids_trigger
  AFTER INSERT OR UPDATE OF role OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_venture_lead_user_ids();
