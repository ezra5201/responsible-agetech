import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Validate sortBy parameter and create ORDER BY clause
    let orderByClause
    if (sortBy === 'title') {
      orderByClause = sortOrder.toLowerCase() === 'asc' 
        ? sql`ORDER BY r.title ASC`
        : sql`ORDER BY r.title DESC`
    } else if (sortBy === 'submitted_by') {
      orderByClause = sortOrder.toLowerCase() === 'asc' 
        ? sql`ORDER BY r.submitted_by ASC`
        : sql`ORDER BY r.submitted_by DESC`
    } else if (sortBy === 'created_at') {
      orderByClause = sortOrder.toLowerCase() === 'asc' 
        ? sql`ORDER BY r.created_at ASC`
        : sql`ORDER BY r.created_at DESC`
    } else {
      // Default to date
      orderByClause = sortOrder.toLowerCase() === 'asc' 
        ? sql`ORDER BY r.date ASC`
        : sql`ORDER BY r.date DESC`
    }
    
    let resources
    
    if (tags.length > 0) {
      // Query with tag filtering
      resources = await sql`
        SELECT DISTINCT r.*, 
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'tag_id', cth.tag_id,
                     'tag_name', cth.tag_name,
                     'tag_slug', cth.tag_slug,
                     'category_name', cth.category_name,
                     'sub_category_name', cth.sub_category_name,
                     'effective_color', cth.effective_color,
                     'full_path', cth.full_path
                   )
                 ) FILTER (WHERE cth.tag_id IS NOT NULL), 
                 '[]'::json
               ) as tags
        FROM resources r
        LEFT JOIN resource_tags rt ON r.id = rt.resource_id
        LEFT JOIN complete_tag_hierarchy cth ON rt.tag_id = cth.tag_id
        WHERE r.id IN (
          SELECT DISTINCT rt2.resource_id 
          FROM resource_tags rt2 
          JOIN complete_tag_hierarchy cth2 ON rt2.tag_id = cth2.tag_id
          WHERE cth2.tag_name = ANY(${tags})
        )
        GROUP BY r.id
        ${orderByClause}
      `
    } else {
      // Query without tag filtering
      resources = await sql`
        SELECT r.*, 
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT(
                     'tag_id', cth.tag_id,
                     'tag_name', cth.tag_name,
                     'tag_slug', cth.tag_slug,
                     'category_name', cth.category_name,
                     'sub_category_name', cth.sub_category_name,
                     'effective_color', cth.effective_color,
                     'full_path', cth.full_path
                   )
                 ) FILTER (WHERE cth.tag_id IS NOT NULL), 
                 '[]'::json
               ) as tags
        FROM resources r
        LEFT JOIN resource_tags rt ON r.id = rt.resource_id
        LEFT JOIN complete_tag_hierarchy cth ON rt.tag_id = cth.tag_id
        GROUP BY r.id
        ${orderByClause}
      `
    }
    
    return NextResponse.json(resources)
  } catch (error) {
    console.error('Detailed error fetching resources:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch resources', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submitted_by, date, title, description, url_link, download_link, linkedin_profile, tagIds } = body
    
    // Insert resource
    const [resource] = await sql`
      INSERT INTO resources (submitted_by, date, title, description, url_link, download_link, linkedin_profile)
      VALUES (${submitted_by}, ${date}, ${title}, ${description}, ${url_link}, ${download_link}, ${linkedin_profile})
      RETURNING *
    `
    
    // Insert resource tags
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO resource_tags (resource_id, tag_id)
          VALUES (${resource.id}, ${tagId})
        `
      }
    }
    
    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 })
  }
}
