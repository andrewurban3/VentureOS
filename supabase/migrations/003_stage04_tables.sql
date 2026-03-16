-- ============================================================
-- 003_stage04_tables.sql
-- Stage 04 (Design & Validate) tables for Venture OS
-- Persists design partner pipeline, feedback summary, MVP feature list.
-- Data is synced to Knowledge Graph (knowledge_nodes) via syncVentureToGraph;
-- source tags in JSONB are used for RAG metadata and UI SourceChip display.
-- ============================================================

-- ============================================================
-- 1. design_partner_pipelines
-- ============================================================
CREATE TABLE IF NOT EXISTS design_partner_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_partner_pipelines_venture ON design_partner_pipelines(venture_id);

-- ============================================================
-- 2. design_partner_feedback_summaries
-- ============================================================
CREATE TABLE IF NOT EXISTS design_partner_feedback_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  partner_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_partner_feedback_summaries_venture ON design_partner_feedback_summaries(venture_id);

-- ============================================================
-- 3. mvp_feature_lists
-- ============================================================
CREATE TABLE IF NOT EXISTS mvp_feature_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mvp_feature_lists_venture ON mvp_feature_lists(venture_id);
