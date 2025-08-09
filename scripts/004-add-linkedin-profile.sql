-- Add LinkedIn profile column to resources table if it doesn't exist
ALTER TABLE resources ADD COLUMN IF NOT EXISTS linkedin_profile VARCHAR(1000);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_resources_linkedin ON resources(linkedin_profile);
