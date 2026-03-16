-- Add venture success criteria to product_roadmaps (Business tab)
ALTER TABLE product_roadmaps
ADD COLUMN IF NOT EXISTS venture_success_criteria jsonb DEFAULT '[]'::jsonb;
