-- Remove 'Peer-reviewed Studies' tag from Research & Academia
DELETE FROM resource_tags 
WHERE tag_id IN (
  SELECT tt.id 
  FROM tag_tags tt
  JOIN tag_sub_categories tsc ON tt.sub_category_id = tsc.id
  JOIN tag_categories tc ON tsc.category_id = tc.id
  WHERE tc.name = 'Content Type' 
    AND tsc.name = 'Research & Academia' 
    AND tt.name = 'Peer-reviewed Studies'
);

DELETE FROM tag_tags 
WHERE id IN (
  SELECT tt.id 
  FROM tag_tags tt
  JOIN tag_sub_categories tsc ON tt.sub_category_id = tsc.id
  JOIN tag_categories tc ON tsc.category_id = tc.id
  WHERE tc.name = 'Content Type' 
    AND tsc.name = 'Research & Academia' 
    AND tt.name = 'Peer-reviewed Studies'
);

-- Update 'Research Reports' to 'Research Paper'
UPDATE tag_tags 
SET name = 'Research Paper',
    slug = 'research-paper'
WHERE id IN (
  SELECT tt.id 
  FROM tag_tags tt
  JOIN tag_sub_categories tsc ON tt.sub_category_id = tsc.id
  JOIN tag_categories tc ON tsc.category_id = tc.id
  WHERE tc.name = 'Content Type' 
    AND tsc.name = 'Research & Academia' 
    AND tt.name = 'Research Reports'
);
