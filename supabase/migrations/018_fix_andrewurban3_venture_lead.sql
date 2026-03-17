-- Standalone fix: ensure andrewurban3@gmail.com is venture-lead
-- Run this in Supabase SQL Editor if 016/017 didn't take effect

-- 1. Update profile to venture-lead
UPDATE public.profiles
SET role = 'venture-lead', updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'andrewurban3@gmail.com' LIMIT 1);

-- 2. Ensure they're in venture_lead_user_ids (for RLS / is_admin)
INSERT INTO public.venture_lead_user_ids (user_id)
SELECT id FROM auth.users WHERE email = 'andrewurban3@gmail.com' LIMIT 1
ON CONFLICT (user_id) DO NOTHING;
