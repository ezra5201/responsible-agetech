-- Remove 'Research & Academia' subcategory from 'Content Type' category
-- This will also remove all tags associated with this subcategory and their resource associations

-- First, let's see what we're removing (for reference)
-- SELECT * FROM complete_tag_hierarchy WHERE category_name = 'Content Type' AND sub_category_name = 'Research & Academia';

-- Remove resource_tags associations for tags in this subcategory
DELETE FROM resource_tags 
WHERE tag_id IN (
  SELECT tt.id 
  FROM tag_tags tt
  JOIN tag_sub_categories tsc ON tt.sub_category_id = tsc.id
  JOIN tag_categories tc ON tsc.category_id = tc.id
  WHERE tc.name = 'Content Type' AND tsc.name = 'Research & Academia'
);

-- Remove the tags in this subcategory
DELETE FROM tag_tags 
WHERE sub_category_id IN (
  SELECT tsc.id 
  FROM tag_sub_categories tsc
  JOIN tag_categories tc ON tsc.category_id = tc.id
  WHERE tc.name = 'Content Type' AND tsc.name = 'Research & Academia'
);

-- Remove the subcategory itself
DELETE FROM tag_sub_categories 
WHERE id IN (
  SELECT tsc.id 
  FROM tag_sub_categories tsc
  JOIN tag_categories tc ON tsc.category_id = tc.id
  WHERE tc.name = 'Content Type' AND tsc.name = 'Research & Academia'
);

-- Verify the removal
-- SELECT * FROM complete_tag_hierarchy WHERE category_name = 'Content Type';
