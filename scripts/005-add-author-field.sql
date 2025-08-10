-- Add author column to resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS author VARCHAR(500);

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_resources_author ON resources(author);
