-- Team roster per venture
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  email text,
  allocation_pct integer DEFAULT 100 CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_venture ON team_members(venture_id);
