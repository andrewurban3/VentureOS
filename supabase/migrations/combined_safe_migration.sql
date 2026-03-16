-- ============================================================
-- combined_safe_migration.sql
-- Idempotent migration: creates all relational tables, knowledge
-- graph, RLS policies, and helper functions.
-- Safe to run on a fresh DB or one with the old JSONB schema.
-- ============================================================

-- Step 0: If the old ventures table (with "data" JSONB column) exists,
-- back it up and rename it out of the way.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ventures'
      AND column_name = 'data'
  ) THEN
    EXECUTE 'ALTER TABLE ventures ADD COLUMN IF NOT EXISTS data_legacy jsonb';
    EXECUTE 'UPDATE ventures SET data_legacy = data WHERE data_legacy IS NULL';
    EXECUTE 'ALTER TABLE ventures RENAME TO ventures_old';
    RAISE NOTICE 'Renamed old ventures table to ventures_old';
  END IF;
END $$;

-- ============================================================
-- 1. ventures (core metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS ventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_value text NOT NULL,
  name_source text NOT NULL DEFAULT 'FOUNDER',
  name_timestamp timestamptz NOT NULL DEFAULT now(),
  stage_value text NOT NULL DEFAULT '02',
  stage_source text NOT NULL DEFAULT 'VL',
  founder_value text NOT NULL DEFAULT 'Founder',
  founder_source text NOT NULL DEFAULT 'VL',
  status_value text NOT NULL DEFAULT 'On Track',
  status_source text NOT NULL DEFAULT 'VL',
  description_value text,
  description_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventures_stage ON ventures(stage_value);
CREATE INDEX IF NOT EXISTS idx_ventures_updated ON ventures(updated_at DESC);

-- ============================================================
-- 2. idea_intakes
-- ============================================================
CREATE TABLE IF NOT EXISTS idea_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  dimension_coverage jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. scoring_results
-- ============================================================
CREATE TABLE IF NOT EXISTS scoring_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  corporate jsonb,
  vc jsonb,
  studio jsonb,
  composite_signal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. icp_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS icp_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  industry text NOT NULL DEFAULT '',
  industry_segments jsonb,
  company_size text NOT NULL DEFAULT '',
  buyer_role text NOT NULL DEFAULT '',
  decision_making_unit text NOT NULL DEFAULT '',
  buying_trigger text,
  pain_points jsonb,
  buying_characteristics jsonb,
  current_alternatives text NOT NULL DEFAULT '',
  willingness_to_pay text NOT NULL DEFAULT '',
  generated_at timestamptz,
  source text NOT NULL DEFAULT 'AI_SYNTHESIS',
  founder_notes text,
  vl_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icp_industry ON icp_documents(industry);

-- ============================================================
-- 5. competitors
-- ============================================================
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text,
  category text NOT NULL DEFAULT 'Direct',
  description text NOT NULL DEFAULT '',
  value_proposition text,
  key_features jsonb,
  recent_news text,
  target_icp text NOT NULL DEFAULT '',
  pricing_model text NOT NULL DEFAULT '',
  funding_scale text NOT NULL DEFAULT '',
  key_strengths text NOT NULL DEFAULT '',
  key_weaknesses text NOT NULL DEFAULT '',
  threat_level text NOT NULL DEFAULT 'Medium',
  threat_rationale text NOT NULL DEFAULT '',
  our_differentiation text NOT NULL DEFAULT '',
  feature_comparison jsonb,
  competitor_summary text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  rejected_by text,
  founder_comments text,
  vl_notes text,
  source text NOT NULL DEFAULT 'AI_RESEARCH',
  citations jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitors_venture ON competitors(venture_id);
CREATE INDEX IF NOT EXISTS idx_competitors_threat ON competitors(threat_level);

-- ============================================================
-- 6. competitor_analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  landscape_summary text,
  citations jsonb,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. pressure_test_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS pressure_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  persona_id text NOT NULL,
  persona_name text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pressure_tests_venture ON pressure_test_sessions(venture_id);

-- ============================================================
-- 8. saved_insights
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  persona_id text NOT NULL,
  persona_name text NOT NULL,
  content text NOT NULL,
  founder_response text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_insights_venture ON saved_insights(venture_id);

-- ============================================================
-- 9. client_list_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS client_list_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  company_size text,
  rationale text NOT NULL DEFAULT '',
  contact_role text,
  linkedin_url text,
  status text NOT NULL DEFAULT 'candidate',
  notes text,
  source text NOT NULL DEFAULT 'AI_RESEARCH',
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_list_venture ON client_list_entries(venture_id);
CREATE INDEX IF NOT EXISTS idx_client_list_status ON client_list_entries(status);

-- ============================================================
-- 10. client_lists
-- ============================================================
CREATE TABLE IF NOT EXISTS client_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. financial_models
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  mvp_cost jsonb,
  unit_economics jsonb,
  market_sizing jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. interview_uploads
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  transcript text NOT NULL DEFAULT '',
  interviewee_role text NOT NULL,
  interviewee_company text NOT NULL DEFAULT '',
  interview_date text,
  conducted_by text NOT NULL DEFAULT 'Founder',
  interview_type text NOT NULL DEFAULT '',
  uploaded_by text NOT NULL DEFAULT 'FOUNDER',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_uploads_venture ON interview_uploads(venture_id);

-- ============================================================
-- 13. interview_extractions
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL UNIQUE REFERENCES interview_uploads(id) ON DELETE CASCADE,
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  pain_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  workarounds jsonb NOT NULL DEFAULT '[]'::jsonb,
  willingness_to_pay jsonb NOT NULL DEFAULT '[]'::jsonb,
  icp_match text,
  feature_requests jsonb NOT NULL DEFAULT '[]'::jsonb,
  objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_quotes jsonb NOT NULL DEFAULT '[]'::jsonb,
  signal_quality text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_extractions_venture ON interview_extractions(venture_id);

-- ============================================================
-- 14. cross_interview_syntheses
-- ============================================================
CREATE TABLE IF NOT EXISTS cross_interview_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  contradictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_quotes jsonb NOT NULL DEFAULT '[]'::jsonb,
  signal_quality text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. moat_assessments
-- ============================================================
CREATE TABLE IF NOT EXISTS moat_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  recommended_moats jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_claims jsonb NOT NULL DEFAULT '[]'::jsonb,
  narrative text,
  founder_notes text,
  vl_notes text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 16. strategy_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS strategy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  persona_id text NOT NULL,
  persona_name text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategy_sessions_venture ON strategy_sessions(venture_id);

-- ============================================================
-- 17. business_briefs
-- ============================================================
CREATE TABLE IF NOT EXISTS business_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  citation_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 18. investment_memos
-- ============================================================
CREATE TABLE IF NOT EXISTS investment_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  citation_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 19. pitch_decks
-- ============================================================
CREATE TABLE IF NOT EXISTS pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  citation_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. venture_citations
-- ============================================================
CREATE TABLE IF NOT EXISTS venture_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  source text NOT NULL,
  title text NOT NULL DEFAULT '',
  url text,
  excerpt text,
  context text NOT NULL DEFAULT '',
  dimension_id text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venture_citations_venture ON venture_citations(venture_id);

-- ============================================================
-- 21. discover_research
-- ============================================================
CREATE TABLE IF NOT EXISTS discover_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid REFERENCES ventures(id) ON DELETE CASCADE,
  type text NOT NULL,
  query text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'AI_RESEARCH',
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discover_research_venture ON discover_research(venture_id);

-- ============================================================
-- 22. solution_definitions
-- ============================================================
CREATE TABLE IF NOT EXISTS solution_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  what_it_does text NOT NULL DEFAULT '',
  differentiation text NOT NULL DEFAULT '',
  what_it_does_not text NOT NULL DEFAULT '',
  ten_x_claim text,
  evidence jsonb DEFAULT '[]'::jsonb,
  founder_notes text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 23. risk_registers
-- ============================================================
CREATE TABLE IF NOT EXISTS risk_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  founder_notes text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS: enable on all tables (safe to call repeatedly)
-- ============================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'ventures','idea_intakes','scoring_results','icp_documents',
    'competitors','competitor_analyses','pressure_test_sessions','saved_insights',
    'client_list_entries','client_lists','financial_models',
    'interview_uploads','interview_extractions','cross_interview_syntheses',
    'moat_assessments','strategy_sessions',
    'business_briefs','investment_memos','pitch_decks',
    'venture_citations','discover_research',
    'solution_definitions','risk_registers'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- ============================================================
-- RLS Policies: create only if they don't already exist
-- ============================================================
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'ventures','idea_intakes','scoring_results','icp_documents',
    'competitors','competitor_analyses','pressure_test_sessions','saved_insights',
    'client_list_entries','client_lists','financial_models',
    'interview_uploads','interview_extractions','cross_interview_syntheses',
    'moat_assessments','strategy_sessions',
    'business_briefs','investment_memos','pitch_decks',
    'venture_citations','discover_research',
    'solution_definitions','risk_registers'
  ])
  LOOP
    -- SELECT
    pol := 'allow_all_select_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', pol, tbl);
    END IF;
    -- INSERT
    pol := 'allow_all_insert_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', pol, tbl);
    END IF;
    -- UPDATE
    pol := 'allow_all_update_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (true) WITH CHECK (true)', pol, tbl);
    END IF;
    -- DELETE
    pol := 'allow_all_delete_' || tbl;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (true)', pol, tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Knowledge Graph: pgvector extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- knowledge_nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  node_type text NOT NULL,
  source_table text NOT NULL,
  source_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1024),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kn_venture ON knowledge_nodes(venture_id);
CREATE INDEX IF NOT EXISTS idx_kn_type ON knowledge_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_kn_source ON knowledge_nodes(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_kn_venture_type ON knowledge_nodes(venture_id, node_type);

-- HNSW vector index (idempotent via IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kn_embedding') THEN
    CREATE INDEX idx_kn_embedding ON knowledge_nodes
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END $$;

-- Unique constraint for upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_kn_source_unique') THEN
    CREATE UNIQUE INDEX idx_kn_source_unique ON knowledge_nodes(venture_id, source_table, source_id);
  END IF;
END $$;

-- ============================================================
-- knowledge_edges
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  edge_type text NOT NULL,
  weight float NOT NULL DEFAULT 1.0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ke_source ON knowledge_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_ke_target ON knowledge_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_ke_type ON knowledge_edges(edge_type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ke_unique') THEN
    CREATE UNIQUE INDEX idx_ke_unique ON knowledge_edges(source_node_id, target_node_id, edge_type);
  END IF;
END $$;

-- Knowledge graph RLS
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['knowledge_nodes','knowledge_edges'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    FOR pol IN SELECT unnest(ARRAY[
      'allow_all_select_' || tbl,
      'allow_all_insert_' || tbl,
      'allow_all_update_' || tbl,
      'allow_all_delete_' || tbl
    ])
    LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl AND policyname = pol) THEN
        IF pol LIKE '%select%' THEN
          EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', pol, tbl);
        ELSIF pol LIKE '%insert%' THEN
          EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', pol, tbl);
        ELSIF pol LIKE '%update%' THEN
          EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (true) WITH CHECK (true)', pol, tbl);
        ELSIF pol LIKE '%delete%' THEN
          EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (true)', pol, tbl);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- match_nodes RPC: vector similarity search
-- ============================================================
CREATE OR REPLACE FUNCTION match_nodes(
  query_embedding vector(1024),
  p_venture_id uuid,
  p_node_types text[] DEFAULT NULL,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  node_type text,
  source_table text,
  source_id text,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kn.id,
    kn.node_type,
    kn.source_table,
    kn.source_id,
    kn.title,
    kn.content,
    kn.metadata,
    1 - (kn.embedding <=> query_embedding) AS similarity
  FROM knowledge_nodes kn
  WHERE kn.venture_id = p_venture_id
    AND kn.embedding IS NOT NULL
    AND (p_node_types IS NULL OR kn.node_type = ANY(p_node_types))
  ORDER BY kn.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- get_connected_nodes RPC: 1-hop graph traversal
-- ============================================================
CREATE OR REPLACE FUNCTION get_connected_nodes(
  p_node_ids uuid[],
  p_edge_types text[] DEFAULT NULL,
  max_count int DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  node_type text,
  title text,
  content text,
  metadata jsonb,
  edge_type text,
  edge_weight float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (kn.id)
    kn.id,
    kn.node_type,
    kn.title,
    kn.content,
    kn.metadata,
    ke.edge_type,
    ke.weight AS edge_weight
  FROM knowledge_edges ke
  JOIN knowledge_nodes kn ON kn.id = CASE
    WHEN ke.source_node_id = ANY(p_node_ids) THEN ke.target_node_id
    ELSE ke.source_node_id
  END
  WHERE (ke.source_node_id = ANY(p_node_ids) OR ke.target_node_id = ANY(p_node_ids))
    AND NOT (kn.id = ANY(p_node_ids))
    AND (p_edge_types IS NULL OR ke.edge_type = ANY(p_edge_types))
  ORDER BY kn.id, ke.weight DESC
  LIMIT max_count;
END;
$$;

-- ============================================================
-- migrate_jsonb_to_tables()
-- Only useful if ventures_old exists with legacy data.
-- Run once after migration: SELECT migrate_jsonb_to_tables();
-- ============================================================
CREATE OR REPLACE FUNCTION migrate_jsonb_to_tables() RETURNS void AS $$
DECLARE
  r record;
  v jsonb;
  comp jsonb;
  pt jsonb;
  ins jsonb;
  upl jsonb;
  ext jsonb;
  sess jsonb;
  cit jsonb;
  res jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ventures_old') THEN
    RAISE NOTICE 'No ventures_old table found -- nothing to migrate';
    RETURN;
  END IF;

  FOR r IN SELECT id, data FROM ventures_old LOOP
    v := r.data;

    INSERT INTO ventures (id, name_value, name_source, name_timestamp,
      stage_value, stage_source, founder_value, founder_source,
      status_value, status_source, description_value, description_source)
    VALUES (
      r.id,
      v->'name'->>'value', COALESCE(v->'name'->>'source','FOUNDER'), COALESCE((v->'name'->>'timestamp')::timestamptz, now()),
      COALESCE(v->'stage'->>'value','02'), COALESCE(v->'stage'->>'source','VL'),
      COALESCE(v->'founder'->>'value','Founder'), COALESCE(v->'founder'->>'source','VL'),
      COALESCE(v->'status'->>'value','On Track'), COALESCE(v->'status'->>'source','VL'),
      v->'description'->>'value', v->'description'->>'source'
    ) ON CONFLICT (id) DO NOTHING;

    IF v ? 'ideaIntake' THEN
      INSERT INTO idea_intakes (venture_id, messages, dimension_coverage, completed)
      VALUES (r.id, COALESCE(v->'ideaIntake'->'messages','[]'::jsonb),
              COALESCE(v->'ideaIntake'->'dimensionCoverage','[]'::jsonb),
              COALESCE((v->'ideaIntake'->>'completed')::boolean, false))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'scoring' THEN
      INSERT INTO scoring_results (venture_id, corporate, vc, studio, composite_signal)
      VALUES (r.id, v->'scoring'->'corporate', v->'scoring'->'vc', v->'scoring'->'studio',
              v->'scoring'->>'compositeSignal')
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'icpDocument' THEN
      INSERT INTO icp_documents (venture_id, industry, company_size, buyer_role,
        decision_making_unit, buying_trigger, pain_points, industry_segments,
        buying_characteristics, current_alternatives, willingness_to_pay,
        generated_at, source, founder_notes, vl_notes)
      VALUES (r.id,
        COALESCE(v->'icpDocument'->>'industry',''),
        COALESCE(v->'icpDocument'->>'companySize',''),
        COALESCE(v->'icpDocument'->>'buyerRole',''),
        COALESCE(v->'icpDocument'->>'decisionMakingUnit',''),
        v->'icpDocument'->>'buyingTrigger',
        v->'icpDocument'->'painPoints',
        v->'icpDocument'->'industrySegments',
        v->'icpDocument'->'buyingCharacteristics',
        COALESCE(v->'icpDocument'->>'currentAlternatives',''),
        COALESCE(v->'icpDocument'->>'willingnessToPay',''),
        (v->'icpDocument'->>'generatedAt')::timestamptz,
        COALESCE(v->'icpDocument'->>'source','AI_SYNTHESIS'),
        v->'icpDocument'->>'founderNotes',
        v->'icpDocument'->>'vlNotes')
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'competitorAnalysis' THEN
      INSERT INTO competitor_analyses (venture_id, landscape_summary, citations, generated_at)
      VALUES (r.id, v->'competitorAnalysis'->>'landscapeSummary',
              v->'competitorAnalysis'->'citations',
              (v->'competitorAnalysis'->>'generatedAt')::timestamptz)
      ON CONFLICT (venture_id) DO NOTHING;

      IF v->'competitorAnalysis' ? 'competitors' THEN
        FOR comp IN SELECT * FROM jsonb_array_elements(v->'competitorAnalysis'->'competitors') LOOP
          INSERT INTO competitors (id, venture_id, name, website_url, category, description,
            value_proposition, key_features, recent_news, target_icp, pricing_model,
            funding_scale, key_strengths, key_weaknesses, threat_level, threat_rationale,
            our_differentiation, feature_comparison, competitor_summary, status,
            rejection_reason, rejected_by, founder_comments, vl_notes, source, citations)
          VALUES (
            COALESCE((comp->>'id')::uuid, gen_random_uuid()), r.id,
            COALESCE(comp->>'name',''), comp->>'websiteUrl',
            COALESCE(comp->>'category','Direct'), COALESCE(comp->>'description',''),
            comp->>'valueProposition', comp->'keyFeatures', comp->>'recentNews',
            COALESCE(comp->>'targetIcp',''), COALESCE(comp->>'pricingModel',''),
            COALESCE(comp->>'fundingScale',''), COALESCE(comp->>'keyStrengths',''),
            COALESCE(comp->>'keyWeaknesses',''), COALESCE(comp->>'threatLevel','Medium'),
            COALESCE(comp->>'threatRationale',''), COALESCE(comp->>'ourDifferentiation',''),
            comp->'featureComparison', comp->>'competitorSummary',
            COALESCE(comp->>'status','pending'), comp->>'rejectionReason',
            comp->>'rejectedBy', comp->>'founderComments', comp->>'vlNotes',
            COALESCE(comp->>'source','AI_RESEARCH'), comp->'citations'
          ) ON CONFLICT (id) DO NOTHING;
        END LOOP;
      END IF;
    END IF;

    IF v ? 'pressureTests' THEN
      FOR pt IN SELECT * FROM jsonb_array_elements(v->'pressureTests') LOOP
        INSERT INTO pressure_test_sessions (venture_id, persona_id, persona_name, messages, started_at)
        VALUES (r.id, COALESCE(pt->>'personaId',''), COALESCE(pt->>'personaName',''),
                COALESCE(pt->'messages','[]'::jsonb),
                COALESCE((pt->>'startedAt')::timestamptz, now()));
      END LOOP;
    END IF;

    IF v ? 'savedInsights' THEN
      FOR ins IN SELECT * FROM jsonb_array_elements(v->'savedInsights') LOOP
        INSERT INTO saved_insights (id, venture_id, persona_id, persona_name, content, founder_response, saved_at)
        VALUES (COALESCE((ins->>'id')::uuid, gen_random_uuid()), r.id,
                COALESCE(ins->>'personaId',''), COALESCE(ins->>'personaName',''),
                COALESCE(ins->>'content',''), ins->>'founderResponse',
                COALESCE((ins->>'savedAt')::timestamptz, now()))
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    IF v ? 'clientList' THEN
      INSERT INTO client_lists (venture_id, generated_at)
      VALUES (r.id, COALESCE((v->'clientList'->>'generatedAt')::timestamptz, now()))
      ON CONFLICT (venture_id) DO NOTHING;

      IF v->'clientList' ? 'entries' THEN
        FOR comp IN SELECT * FROM jsonb_array_elements(v->'clientList'->'entries') LOOP
          INSERT INTO client_list_entries (id, venture_id, company_name, industry, company_size,
            rationale, contact_role, linkedin_url, status, notes, source, generated_at)
          VALUES (COALESCE((comp->>'id')::uuid, gen_random_uuid()), r.id,
                  COALESCE(comp->>'companyName',''), comp->>'industry', comp->>'companySize',
                  COALESCE(comp->>'rationale',''), comp->>'contactRole', comp->>'linkedInUrl',
                  COALESCE(comp->>'status','candidate'), comp->>'notes',
                  COALESCE(comp->>'source','AI_RESEARCH'),
                  COALESCE((comp->>'generatedAt')::timestamptz, now()))
          ON CONFLICT (id) DO NOTHING;
        END LOOP;
      END IF;
    END IF;

    IF v ? 'financialModels' THEN
      INSERT INTO financial_models (venture_id, mvp_cost, unit_economics, market_sizing)
      VALUES (r.id, v->'financialModels'->'mvpCost', v->'financialModels'->'unitEconomics',
              v->'financialModels'->'marketSizing')
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'interviews' THEN
      IF v->'interviews' ? 'uploads' THEN
        FOR upl IN SELECT * FROM jsonb_array_elements(v->'interviews'->'uploads') LOOP
          INSERT INTO interview_uploads (id, venture_id, transcript, interviewee_role,
            interviewee_company, interview_date, conducted_by, interview_type, uploaded_by, uploaded_at)
          VALUES (COALESCE((upl->>'id')::uuid, gen_random_uuid()), r.id,
                  COALESCE(upl->>'transcript',''), COALESCE(upl->>'intervieweeRole','Other'),
                  COALESCE(upl->>'intervieweeCompany',''), upl->>'interviewDate',
                  COALESCE(upl->>'conductedBy','Founder'), COALESCE(upl->>'interviewType',''),
                  COALESCE(upl->>'uploadedBy','FOUNDER'),
                  COALESCE((upl->>'uploadedAt')::timestamptz, now()))
          ON CONFLICT (id) DO NOTHING;

          IF v->'interviews'->'extractions' ? (upl->>'id') THEN
            ext := v->'interviews'->'extractions'->(upl->>'id');
            INSERT INTO interview_extractions (upload_id, venture_id, pain_points, workarounds,
              willingness_to_pay, icp_match, feature_requests, objections, key_quotes,
              signal_quality, generated_at)
            VALUES ((upl->>'id')::uuid, r.id,
                    COALESCE(ext->'painPoints','[]'::jsonb), COALESCE(ext->'workarounds','[]'::jsonb),
                    COALESCE(ext->'willingnessToPay','[]'::jsonb), ext->>'icpMatch',
                    COALESCE(ext->'featureRequests','[]'::jsonb), COALESCE(ext->'objections','[]'::jsonb),
                    COALESCE(ext->'keyQuotes','[]'::jsonb), ext->>'signalQuality',
                    COALESCE((ext->>'generatedAt')::timestamptz, now()))
            ON CONFLICT (upload_id) DO NOTHING;
          END IF;
        END LOOP;
      END IF;

      IF v->'interviews' ? 'synthesis' THEN
        INSERT INTO cross_interview_syntheses (venture_id, themes, contradictions, top_quotes,
          signal_quality, generated_at)
        VALUES (r.id,
                COALESCE(v->'interviews'->'synthesis'->'themes','[]'::jsonb),
                COALESCE(v->'interviews'->'synthesis'->'contradictions','[]'::jsonb),
                COALESCE(v->'interviews'->'synthesis'->'topQuotes','[]'::jsonb),
                v->'interviews'->'synthesis'->>'signalQuality',
                COALESCE((v->'interviews'->'synthesis'->>'generatedAt')::timestamptz, now()))
        ON CONFLICT (venture_id) DO NOTHING;
      END IF;
    END IF;

    IF v ? 'strategyMoat' AND v->'strategyMoat' ? 'assessment' THEN
      INSERT INTO moat_assessments (venture_id, recommended_moats, current_claims, narrative,
        founder_notes, vl_notes, generated_at)
      VALUES (r.id,
              COALESCE(v->'strategyMoat'->'assessment'->'recommendedMoats','[]'::jsonb),
              COALESCE(v->'strategyMoat'->'assessment'->'currentClaims','[]'::jsonb),
              v->'strategyMoat'->'assessment'->>'narrative',
              v->'strategyMoat'->>'founderNotes', v->'strategyMoat'->>'vlNotes',
              COALESCE((v->'strategyMoat'->'assessment'->>'generatedAt')::timestamptz, now()))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'strategyMoat' AND v->'strategyMoat' ? 'sessions' THEN
      FOR sess IN SELECT * FROM jsonb_array_elements(v->'strategyMoat'->'sessions') LOOP
        INSERT INTO strategy_sessions (venture_id, persona_id, persona_name, messages, started_at)
        VALUES (r.id, COALESCE(sess->>'personaId',''), COALESCE(sess->>'personaName',''),
                COALESCE(sess->'messages','[]'::jsonb),
                COALESCE((sess->>'startedAt')::timestamptz, now()));
      END LOOP;
    END IF;

    IF v ? 'businessBrief' THEN
      INSERT INTO business_briefs (venture_id, content, citation_ids, generated_at, version)
      VALUES (r.id, COALESCE(v->'businessBrief'->'content','{}'::jsonb),
              COALESCE(v->'businessBrief'->'citationIds','[]'::jsonb),
              (v->'businessBrief'->>'generatedAt')::timestamptz,
              COALESCE((v->'businessBrief'->>'version')::integer, 1))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'investmentMemo' THEN
      INSERT INTO investment_memos (venture_id, content, citation_ids, generated_at, version)
      VALUES (r.id, COALESCE(v->'investmentMemo'->'content','{}'::jsonb),
              COALESCE(v->'investmentMemo'->'citationIds','[]'::jsonb),
              (v->'investmentMemo'->>'generatedAt')::timestamptz,
              COALESCE((v->'investmentMemo'->>'version')::integer, 1))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'pitchDeck' THEN
      INSERT INTO pitch_decks (venture_id, content, citation_ids, generated_at, version)
      VALUES (r.id, COALESCE(v->'pitchDeck'->'content','{}'::jsonb),
              COALESCE(v->'pitchDeck'->'citationIds','[]'::jsonb),
              (v->'pitchDeck'->>'generatedAt')::timestamptz,
              COALESCE((v->'pitchDeck'->>'version')::integer, 1))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    IF v ? 'citations' THEN
      FOR cit IN SELECT * FROM jsonb_array_elements(v->'citations') LOOP
        INSERT INTO venture_citations (id, venture_id, source, title, url, excerpt, context, dimension_id, generated_at)
        VALUES (COALESCE((cit->>'id')::uuid, gen_random_uuid()), r.id,
                COALESCE(cit->>'source','AI_RESEARCH'), COALESCE(cit->>'title',''),
                cit->>'url', cit->>'excerpt', COALESCE(cit->>'context',''),
                cit->>'dimensionId', COALESCE((cit->>'generatedAt')::timestamptz, now()))
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    IF v ? 'discover' AND v->'discover' ? 'research' THEN
      FOR res IN SELECT * FROM jsonb_array_elements(v->'discover'->'research') LOOP
        INSERT INTO discover_research (id, venture_id, type, query, content, citations, source, generated_at)
        VALUES (COALESCE((res->>'id')::uuid, gen_random_uuid()), r.id,
                COALESCE(res->>'type','vc_thesis'), COALESCE(res->>'query',''),
                COALESCE(res->>'content',''), COALESCE(res->'citations','[]'::jsonb),
                COALESCE(res->>'source','AI_RESEARCH'),
                COALESCE((res->>'generatedAt')::timestamptz, now()))
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

  END LOOP;
END;
$$ LANGUAGE plpgsql;
