-- Add LinkedIn profile link field to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS linkedin_profile VARCHAR(1000);

-- Create index for better performance if needed
CREATE INDEX IF NOT EXISTS idx_resources_linkedin ON resources(linkedin_profile);
