-- ============================================================
-- 001_relational_schema.sql
-- Relational tables for Venture OS knowledge graph RAG
-- ============================================================

-- Migrate from old schema only if ventures exists with legacy data column.
-- Skip if ventures has new schema (name_value) or doesn't exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ventures')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ventures' AND column_name = 'data')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ventures' AND column_name = 'name_value') THEN
    ALTER TABLE ventures ADD COLUMN IF NOT EXISTS data_legacy jsonb;
    UPDATE ventures SET data_legacy = data WHERE data_legacy IS NULL;
    DROP TABLE IF EXISTS ventures_old;
    ALTER TABLE ventures RENAME TO ventures_old;
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
-- 6. competitor_analyses (landscape summary per venture)
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
-- 10. client_lists (metadata per venture)
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
-- RLS Policies (basic: allow all with anon key)
-- ============================================================
ALTER TABLE ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pressure_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_interview_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE moat_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE discover_research ENABLE ROW LEVEL SECURITY;

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
    'venture_citations','discover_research'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_select_%s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_insert_%s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_update_%s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_delete_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_select_%s" ON %I FOR SELECT USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_insert_%s" ON %I FOR INSERT WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_update_%s" ON %I FOR UPDATE USING (true) WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_delete_%s" ON %I FOR DELETE USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- migrate_jsonb_to_tables()
-- Reads ventures_old.data JSONB and distributes to new tables.
-- Run once: SELECT migrate_jsonb_to_tables();
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
  FOR r IN SELECT id, data FROM ventures_old LOOP
    v := r.data;

    -- 1. ventures
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

    -- 2. idea_intakes
    IF v ? 'ideaIntake' THEN
      INSERT INTO idea_intakes (venture_id, messages, dimension_coverage, completed)
      VALUES (r.id, COALESCE(v->'ideaIntake'->'messages','[]'::jsonb),
              COALESCE(v->'ideaIntake'->'dimensionCoverage','[]'::jsonb),
              COALESCE((v->'ideaIntake'->>'completed')::boolean, false))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    -- 3. scoring_results
    IF v ? 'scoring' THEN
      INSERT INTO scoring_results (venture_id, corporate, vc, studio, composite_signal)
      VALUES (r.id, v->'scoring'->'corporate', v->'scoring'->'vc', v->'scoring'->'studio',
              v->'scoring'->>'compositeSignal')
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    -- 4. icp_documents
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

    -- 5. competitors + competitor_analyses
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

    -- 6. pressure_test_sessions
    IF v ? 'pressureTests' THEN
      FOR pt IN SELECT * FROM jsonb_array_elements(v->'pressureTests') LOOP
        INSERT INTO pressure_test_sessions (venture_id, persona_id, persona_name, messages, started_at)
        VALUES (r.id, COALESCE(pt->>'personaId',''), COALESCE(pt->>'personaName',''),
                COALESCE(pt->'messages','[]'::jsonb),
                COALESCE((pt->>'startedAt')::timestamptz, now()));
      END LOOP;
    END IF;

    -- 7. saved_insights
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

    -- 8. client_list + entries
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

    -- 9. financial_models
    IF v ? 'financialModels' THEN
      INSERT INTO financial_models (venture_id, mvp_cost, unit_economics, market_sizing)
      VALUES (r.id, v->'financialModels'->'mvpCost', v->'financialModels'->'unitEconomics',
              v->'financialModels'->'marketSizing')
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    -- 10. interview_uploads + extractions + synthesis
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

          -- Extraction for this upload
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

    -- 11. moat_assessments
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

    -- 12. strategy_sessions
    IF v ? 'strategyMoat' AND v->'strategyMoat' ? 'sessions' THEN
      FOR sess IN SELECT * FROM jsonb_array_elements(v->'strategyMoat'->'sessions') LOOP
        INSERT INTO strategy_sessions (venture_id, persona_id, persona_name, messages, started_at)
        VALUES (r.id, COALESCE(sess->>'personaId',''), COALESCE(sess->>'personaName',''),
                COALESCE(sess->'messages','[]'::jsonb),
                COALESCE((sess->>'startedAt')::timestamptz, now()));
      END LOOP;
    END IF;

    -- 13. business_briefs
    IF v ? 'businessBrief' THEN
      INSERT INTO business_briefs (venture_id, content, citation_ids, generated_at, version)
      VALUES (r.id, COALESCE(v->'businessBrief'->'content','{}'::jsonb),
              COALESCE(v->'businessBrief'->'citationIds','[]'::jsonb),
              (v->'businessBrief'->>'generatedAt')::timestamptz,
              COALESCE((v->'businessBrief'->>'version')::integer, 1))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    -- 14. investment_memos
    IF v ? 'investmentMemo' THEN
      INSERT INTO investment_memos (venture_id, content, citation_ids, generated_at, version)
      VALUES (r.id, COALESCE(v->'investmentMemo'->'content','{}'::jsonb),
              COALESCE(v->'investmentMemo'->'citationIds','[]'::jsonb),
              (v->'investmentMemo'->>'generatedAt')::timestamptz,
              COALESCE((v->'investmentMemo'->>'version')::integer, 1))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    -- 15. pitch_decks
    IF v ? 'pitchDeck' THEN
      INSERT INTO pitch_decks (venture_id, content, citation_ids, generated_at, version)
      VALUES (r.id, COALESCE(v->'pitchDeck'->'content','{}'::jsonb),
              COALESCE(v->'pitchDeck'->'citationIds','[]'::jsonb),
              (v->'pitchDeck'->>'generatedAt')::timestamptz,
              COALESCE((v->'pitchDeck'->>'version')::integer, 1))
      ON CONFLICT (venture_id) DO NOTHING;
    END IF;

    -- 16. venture_citations
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

    -- 17. discover_research
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
