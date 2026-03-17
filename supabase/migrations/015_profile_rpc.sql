-- RPC to fetch current user's profile (bypasses RLS) for reliable profile refresh
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT to_jsonb(row_to_json(p))
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;
