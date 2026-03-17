-- Add permissive RLS for gate_reviews so Stage Gate page can load pending reviews.
-- Creates table if missing (007 may not have run), then enables RLS and allows all operations.

CREATE TABLE IF NOT EXISTS gate_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  requested_by text NOT NULL DEFAULT 'Founder',
  decided_at timestamptz,
  decided_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gate_reviews_venture ON gate_reviews(venture_id);
CREATE INDEX IF NOT EXISTS idx_gate_reviews_status ON gate_reviews(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gate_reviews_pending_venture ON gate_reviews(venture_id) WHERE status = 'pending';

ALTER TABLE gate_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gate_reviews_allow_all_select ON gate_reviews;
DROP POLICY IF EXISTS gate_reviews_allow_all_insert ON gate_reviews;
DROP POLICY IF EXISTS gate_reviews_allow_all_update ON gate_reviews;
DROP POLICY IF EXISTS gate_reviews_allow_all_delete ON gate_reviews;

CREATE POLICY gate_reviews_allow_all_select ON gate_reviews FOR SELECT USING (true);
CREATE POLICY gate_reviews_allow_all_insert ON gate_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY gate_reviews_allow_all_update ON gate_reviews FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY gate_reviews_allow_all_delete ON gate_reviews FOR DELETE USING (true);
