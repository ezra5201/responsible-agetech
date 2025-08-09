import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Get the complete hierarchy using the view
    const hierarchyData = await sql`
      SELECT * FROM complete_tag_hierarchy 
      WHERE tag_id IS NOT NULL
      ORDER BY category_name, sub_category_name, tag_name
    `
    
    // Build the hierarchy structure
    const hierarchy: any = {}
    
    hierarchyData.forEach((row) => {
      const categoryName = row.category_name
      const subCategoryName = row.sub_category_name
      
      // Initialize category if it doesn't exist
      if (!hierarchy[categoryName]) {
        hierarchy[categoryName] = {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
          color: row.category_color,
          icon: null,
          subcategories: {}
        }
      }
      
      // Initialize subcategory if it doesn't exist
      if (subCategoryName && !hierarchy[categoryName].subcategories[subCategoryName]) {
        hierarchy[categoryName].subcategories[subCategoryName] = {
          id: row.sub_category_id,
          name: row.sub_category_name,
          slug: row.sub_category_slug,
          color: row.effective_color,
          icon: null,
          tags: []
        }
      }
      
      // Add the tag
      if (subCategoryName) {
        hierarchy[categoryName].subcategories[subCategoryName].tags.push({
          id: row.tag_id,
          name: row.tag_name,
          slug: row.tag_slug,
          color: row.effective_color,
          category_id: row.category_id,
          sub_category_id: row.sub_category_id
        })
      }
    })
    
    // Also get flat list of all tags for backward compatibility
    const flatTags = await sql`
      SELECT 
        id, name, slug, color, category_id, sub_category_id,
        sort_order, is_active, created_at, updated_at
      FROM tag_tags 
      WHERE is_active = true
      ORDER BY name
    `
    
    return NextResponse.json({
      flat: flatTags,
      hierarchy: hierarchy
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color, category_id, sub_category_id } = await request.json()
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const [tag] = await sql`
      INSERT INTO tag_tags (name, slug, category_id, sub_category_id, color)
      VALUES (${name}, ${slug}, ${category_id}, ${sub_category_id || null}, ${color})
      RETURNING *
    `
    
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
