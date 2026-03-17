-- Add acquisition funnel to GTM trackers
ALTER TABLE gtm_trackers
ADD COLUMN IF NOT EXISTS acquisition_funnel jsonb DEFAULT '[]'::jsonb;
