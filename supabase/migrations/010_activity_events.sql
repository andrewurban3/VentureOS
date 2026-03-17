-- Activity feed / audit log for ventures
CREATE TABLE IF NOT EXISTS activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid REFERENCES ventures(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_venture ON activity_events(venture_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_created ON activity_events(created_at DESC);
