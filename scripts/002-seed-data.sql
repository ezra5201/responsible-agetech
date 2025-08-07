-- Insert sample tags
INSERT INTO tags (name, color) VALUES 
  ('Web Development', '#3B82F6'),
  ('Design', '#EF4444'),
  ('Marketing', '#10B981'),
  ('Business', '#F59E0B'),
  ('Tools', '#8B5CF6'),
  ('Education', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Insert sample resources
INSERT INTO resources (submitted_by, date, title, description, url_link, download_link) VALUES 
  ('John Doe', '2024-01-15', 'Complete Web Development Guide', 'A comprehensive guide covering HTML, CSS, JavaScript, and modern frameworks', 'https://example.com/web-guide', NULL),
  ('Jane Smith', '2024-01-20', 'Design System Template', 'Ready-to-use design system template for Figma', NULL, 'https://drive.google.com/file/d/example'),
  ('Mike Johnson', '2024-02-01', 'Marketing Analytics Dashboard', 'Interactive dashboard template for tracking marketing metrics', 'https://example.com/dashboard', 'https://example.com/download/dashboard.zip')
ON CONFLICT DO NOTHING;

-- Link resources to tags
INSERT INTO resource_tags (resource_id, tag_id) 
SELECT r.id, t.id 
FROM resources r, tags t 
WHERE (r.title = 'Complete Web Development Guide' AND t.name IN ('Web Development', 'Education'))
   OR (r.title = 'Design System Template' AND t.name IN ('Design', 'Tools'))
   OR (r.title = 'Marketing Analytics Dashboard' AND t.name IN ('Marketing', 'Tools'))
ON CONFLICT DO NOTHING;
