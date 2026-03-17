-- ============================================================
-- 002_knowledge_graph.sql
-- Knowledge graph layer with pgvector for RAG retrieval
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- knowledge_nodes
-- Each meaningful piece of venture data becomes a node with
-- a Voyage AI embedding for semantic search.
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

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX IF NOT EXISTS idx_kn_embedding ON knowledge_nodes
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Unique constraint to enable upsert by source
CREATE UNIQUE INDEX IF NOT EXISTS idx_kn_source_unique ON knowledge_nodes(venture_id, source_table, source_id);

-- ============================================================
-- knowledge_edges
-- Typed relationships between nodes for graph traversal.
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

-- Prevent duplicate edges
CREATE UNIQUE INDEX IF NOT EXISTS idx_ke_unique ON knowledge_edges(source_node_id, target_node_id, edge_type);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_select_knowledge_nodes" ON knowledge_nodes;
DROP POLICY IF EXISTS "allow_all_insert_knowledge_nodes" ON knowledge_nodes;
DROP POLICY IF EXISTS "allow_all_update_knowledge_nodes" ON knowledge_nodes;
DROP POLICY IF EXISTS "allow_all_delete_knowledge_nodes" ON knowledge_nodes;
CREATE POLICY "allow_all_select_knowledge_nodes" ON knowledge_nodes FOR SELECT USING (true);
CREATE POLICY "allow_all_insert_knowledge_nodes" ON knowledge_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update_knowledge_nodes" ON knowledge_nodes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete_knowledge_nodes" ON knowledge_nodes FOR DELETE USING (true);

DROP POLICY IF EXISTS "allow_all_select_knowledge_edges" ON knowledge_edges;
DROP POLICY IF EXISTS "allow_all_insert_knowledge_edges" ON knowledge_edges;
DROP POLICY IF EXISTS "allow_all_update_knowledge_edges" ON knowledge_edges;
DROP POLICY IF EXISTS "allow_all_delete_knowledge_edges" ON knowledge_edges;
CREATE POLICY "allow_all_select_knowledge_edges" ON knowledge_edges FOR SELECT USING (true);
CREATE POLICY "allow_all_insert_knowledge_edges" ON knowledge_edges FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update_knowledge_edges" ON knowledge_edges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_delete_knowledge_edges" ON knowledge_edges FOR DELETE USING (true);

-- ============================================================
-- match_nodes: vector similarity search RPC
--
-- Called from the app via supabase.rpc('match_nodes', { ... })
-- Returns top-K nodes by cosine similarity, optionally filtered
-- by venture_id and node_types.
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
-- get_connected_nodes: 1-hop edge traversal from a set of nodes
--
-- Given an array of node IDs, returns all nodes connected by edges
-- (in either direction) that aren't already in the input set.
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
