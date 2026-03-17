-- Auth: profiles and venture assignment
-- Enable Supabase Auth in your project first (Dashboard -> Authentication -> Enable Email)

-- Profiles: maps auth.users to roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'founder' CHECK (role IN ('founder', 'venture-lead', 'admin')),
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Add founder_user_id to ventures (nullable for existing data)
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS founder_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS: ventures
ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ventures_select_policy ON ventures;
CREATE POLICY ventures_select_policy ON ventures FOR SELECT USING (
  founder_user_id IS NULL
  OR founder_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('venture-lead', 'admin'))
);

DROP POLICY IF EXISTS ventures_insert_policy ON ventures;
CREATE POLICY ventures_insert_policy ON ventures FOR INSERT WITH CHECK (
  founder_user_id IS NULL OR founder_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('venture-lead', 'admin'))
);

DROP POLICY IF EXISTS ventures_update_policy ON ventures;
CREATE POLICY ventures_update_policy ON ventures FOR UPDATE USING (
  founder_user_id IS NULL OR founder_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('venture-lead', 'admin'))
);

DROP POLICY IF EXISTS ventures_delete_policy ON ventures;
CREATE POLICY ventures_delete_policy ON ventures FOR DELETE USING (
  founder_user_id IS NULL OR founder_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('venture-lead', 'admin'))
);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'founder');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
