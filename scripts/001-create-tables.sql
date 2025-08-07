-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  submitted_by VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  url_link VARCHAR(1000),
  download_link VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for resource tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_date ON resources(date);
CREATE INDEX IF NOT EXISTS idx_resources_title ON resources(title);
CREATE INDEX IF NOT EXISTS idx_resource_tags_resource ON resource_tags(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tag ON resource_tags(tag_id);
