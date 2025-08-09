import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    
    let subcategories
    if (categoryId) {
      subcategories = await sql`
        SELECT * FROM tag_sub_categories 
        WHERE category_id = ${categoryId} AND is_active = true
        ORDER BY sort_order, name
      `
    } else {
      subcategories = await sql`
        SELECT * FROM tag_sub_categories 
        WHERE is_active = true
        ORDER BY sort_order, name
      `
    }
    
    return NextResponse.json(subcategories)
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, category_id, color, icon } = await request.json()
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const [subcategory] = await sql`
      INSERT INTO tag_sub_categories (name, slug, description, category_id, color, icon)
      VALUES (${name}, ${slug}, ${description}, ${category_id}, ${color}, ${icon})
      RETURNING *
    `
    
    return NextResponse.json(subcategory, { status: 201 })
  } catch (error) {
    console.error('Error creating subcategory:', error)
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 })
  }
}
