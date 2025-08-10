-- Add author column to resources table
ALTER TABLE resources ADD COLUMN author TEXT;

-- Add index for author searches (optional but recommended for performance)
CREATE INDEX idx_resources_author ON resources(author);

-- Update any existing resources to have NULL author (they can be updated later)
-- No action needed as ALTER TABLE ADD COLUMN sets NULL by default
