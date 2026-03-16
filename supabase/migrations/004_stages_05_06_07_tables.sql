-- ============================================================
-- 004_stages_05_06_07_tables.sql
-- Stage 05 (MVP Readiness), Stage 06 (Build & Pilot), Stage 07 (Commercial)
-- Source tags in JSONB for RAG metadata and UI SourceChip.
-- ============================================================

-- ============================================================
-- Stage 05
-- ============================================================
CREATE TABLE IF NOT EXISTS technical_architectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'AI_SYNTHESIS',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_technical_architectures_venture ON technical_architectures(venture_id);

CREATE TABLE IF NOT EXISTS product_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'AI_SYNTHESIS',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_roadmaps_venture ON product_roadmaps(venture_id);

CREATE TABLE IF NOT EXISTS feature_prd_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  prds jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feature_prd_lists_venture ON feature_prd_lists(venture_id);

CREATE TABLE IF NOT EXISTS sprint_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  sprints jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'AI_SYNTHESIS',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sprint_plans_venture ON sprint_plans(venture_id);

-- ============================================================
-- Stage 06
-- ============================================================
CREATE TABLE IF NOT EXISTS client_feedback_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'AI_SYNTHESIS',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_feedback_summaries_venture ON client_feedback_summaries(venture_id);

CREATE TABLE IF NOT EXISTS updated_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'AI_SYNTHESIS',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_updated_roadmaps_venture ON updated_roadmaps(venture_id);

CREATE TABLE IF NOT EXISTS pricing_labs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation jsonb,
  version_history jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_labs_venture ON pricing_labs(venture_id);

-- ============================================================
-- Stage 07
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_implementation_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  pricing_lab_snapshot jsonb,
  rollout_status text NOT NULL DEFAULT '',
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'VL',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_implementation_trackers_venture ON pricing_implementation_trackers(venture_id);

CREATE TABLE IF NOT EXISTS gtm_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  gtm_plan text NOT NULL DEFAULT '',
  pricing_implementation_plan text NOT NULL DEFAULT '',
  signed_sow_tracker jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'VL',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gtm_trackers_venture ON gtm_trackers(venture_id);
