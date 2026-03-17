-- Gate reviews for stage-gate governance
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
