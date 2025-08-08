import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Get all tags with their hierarchy information
    const tags = await sql`
      SELECT id, name, color, parent_id, category_level, sort_order, created_at
      FROM tags 
      ORDER BY category_level, sort_order, name
    `
    
    // Build the hierarchy: Categories -> Subcategories -> Tags
    const hierarchy = {}
    
    // First pass: Create categories (level 1)
    tags.forEach(tag => {
      if (tag.category_level === 1) {
        hierarchy[tag.name] = {
          ...tag,
          subcategories: {}
        }
      }
    })
    
    // Second pass: Create subcategories (level 2)
    tags.forEach(tag => {
      if (tag.category_level === 2 && tag.parent_id) {
        const parentCategory = tags.find(t => t.id === tag.parent_id)
        if (parentCategory && hierarchy[parentCategory.name]) {
          hierarchy[parentCategory.name].subcategories[tag.name] = {
            ...tag,
            tags: []
          }
        }
      }
    })
    
    // Third pass: Add tags (level 3+) to their subcategories
    tags.forEach(tag => {
      if (tag.category_level >= 3 && tag.parent_id) {
        // Find the subcategory this tag belongs to
        const parentTag = tags.find(t => t.id === tag.parent_id)
        if (parentTag) {
          // Find the root category
          let currentParent = parentTag
          while (currentParent && currentParent.category_level > 2) {
            currentParent = tags.find(t => t.id === currentParent.parent_id)
          }
          
          if (currentParent && currentParent.category_level === 2) {
            const grandParent = tags.find(t => t.id === currentParent.parent_id)
            if (grandParent && hierarchy[grandParent.name] && hierarchy[grandParent.name].subcategories[currentParent.name]) {
              hierarchy[grandParent.name].subcategories[currentParent.name].tags.push(tag)
            }
          }
        }
      }
    })
    
    return NextResponse.json({
      flat: tags,
      hierarchy: hierarchy
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json()
    
    const [tag] = await sql`
      INSERT INTO tags (name, color)
      VALUES (${name}, ${color})
      RETURNING *
    `
    
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
