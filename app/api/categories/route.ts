import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const categories = await sql`
      SELECT * FROM tag_categories 
      WHERE is_active = true
      ORDER BY sort_order, name
    `
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, color, icon } = await request.json()
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const [category] = await sql`
      INSERT INTO tag_categories (name, slug, description, color, icon)
      VALUES (${name}, ${slug}, ${description}, ${color}, ${icon})
      RETURNING *
    `
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
