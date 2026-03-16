-- Add revenue model and business KPIs to product_roadmaps (Business tab)
ALTER TABLE product_roadmaps
ADD COLUMN IF NOT EXISTS revenue_model text DEFAULT '',
ADD COLUMN IF NOT EXISTS business_kpis jsonb DEFAULT '[]'::jsonb;
