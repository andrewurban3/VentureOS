-- Add KPI tracker to product_roadmaps (numeric KPIs with targets and snapshots)
ALTER TABLE product_roadmaps
ADD COLUMN IF NOT EXISTS kpi_tracker jsonb DEFAULT '{"definitions":[],"snapshots":[]}'::jsonb;
