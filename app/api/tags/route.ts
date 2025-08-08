import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Get all tags with their hierarchy information
    const tags = await sql`
      WITH RECURSIVE tag_hierarchy AS (
        -- Base case: root categories (level 1)
        SELECT id, name, color, parent_id, category_level, sort_order, 
               ARRAY[name] as path, name as root_category
        FROM tags 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: child tags
        SELECT t.id, t.name, t.color, t.parent_id, t.category_level, t.sort_order,
               th.path || t.name, th.root_category
        FROM tags t
        JOIN tag_hierarchy th ON t.parent_id = th.id
      )
      SELECT * FROM tag_hierarchy 
      ORDER BY root_category, category_level, sort_order, name
    `
    
    // Group tags by category for easier frontend consumption
    const categorizedTags = tags.reduce((acc, tag) => {
      if (tag.category_level === 1) {
        // This is a main category
        acc[tag.name] = {
          ...tag,
          children: []
        }
      } else {
        // This is a subcategory or tag
        const rootCategory = tag.root_category
        if (acc[rootCategory]) {
          acc[rootCategory].children.push(tag)
        }
      }
      return acc
    }, {})
    
    return NextResponse.json({
      flat: tags,
      categorized: categorizedTags
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
