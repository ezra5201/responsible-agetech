-- Add "author" column for resources
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS author TEXT;

-- Optional index to speed up lookups by author
CREATE INDEX IF NOT EXISTS idx_resources_author ON resources(author);
