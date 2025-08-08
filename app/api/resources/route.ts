import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set')
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
    }

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
        SELECT DISTINCT r.id, r.submitted_by, r.date, r.title, r.description, 
               r.url_link, r.download_link, 
               CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'resources' 
                               AND column_name = 'linkedin_profile') 
                    THEN r.linkedin_profile 
                    ELSE NULL 
               END as linkedin_profile,
               r.created_at, r.updated_at,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'color', t.color)
                 ) FILTER (WHERE t.id IS NOT NULL), 
                 '[]'::json
               ) as tags
        FROM resources r
        LEFT JOIN resource_tags rt ON r.id = rt.resource_id
        LEFT JOIN tags t ON rt.tag_id = t.id
        WHERE r.id IN (
          SELECT DISTINCT rt2.resource_id 
          FROM resource_tags rt2 
          JOIN tags t2 ON rt2.tag_id = t2.id 
          WHERE t2.name = ANY(${tags})
        )
        GROUP BY r.id, r.date, r.title, r.submitted_by, r.created_at
        ${orderByClause}
      `
    } else {
      // Query without tag filtering
      resources = await sql`
        SELECT r.id, r.submitted_by, r.date, r.title, r.description, 
               r.url_link, r.download_link,
               CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'resources' 
                               AND column_name = 'linkedin_profile') 
                    THEN r.linkedin_profile 
                    ELSE NULL 
               END as linkedin_profile,
               r.created_at, r.updated_at,
               COALESCE(
                 JSON_AGG(
                   JSON_BUILD_OBJECT('id', t.id, 'name', t.name, 'color', t.color)
                 ) FILTER (WHERE t.id IS NOT NULL), 
                 '[]'::json
               ) as tags
        FROM resources r
        LEFT JOIN resource_tags rt ON r.id = rt.resource_id
        LEFT JOIN tags t ON rt.tag_id = t.id
        GROUP BY r.id, r.date, r.title, r.submitted_by, r.created_at
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
    
    // Check if linkedin_profile column exists
    const columnExists = await sql`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' 
        AND column_name = 'linkedin_profile'
      ) as exists
    `
    
    let resource
    
    if (columnExists[0].exists) {
      // Insert with linkedin_profile column
      [resource] = await sql`
        INSERT INTO resources (submitted_by, date, title, description, url_link, download_link, linkedin_profile)
        VALUES (${submitted_by}, ${date}, ${title}, ${description}, ${url_link}, ${download_link}, ${linkedin_profile})
        RETURNING *
      `
    } else {
      // Insert without linkedin_profile column
      [resource] = await sql`
        INSERT INTO resources (submitted_by, date, title, description, url_link, download_link)
        VALUES (${submitted_by}, ${date}, ${title}, ${description}, ${url_link}, ${download_link})
        RETURNING *
      `
    }
    
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
