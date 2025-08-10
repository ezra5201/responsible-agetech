-- Add submitter_email column to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255);

-- Create index for better performance when searching by email
CREATE INDEX IF NOT EXISTS idx_resources_submitter_email ON resources(submitter_email);

-- Add a comment to document the column purpose
COMMENT ON COLUMN resources.submitter_email IS 'Email address of the person who submitted the resource';
