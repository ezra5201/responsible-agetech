import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { submitted_by, date, title, description, url_link, download_link, tagIds } = body
    const resourceId = parseInt(params.id)
    
    // Update resource
    const [resource] = await sql`
      UPDATE resources 
      SET submitted_by = ${submitted_by}, date = ${date}, title = ${title}, 
          description = ${description}, url_link = ${url_link}, 
          download_link = ${download_link}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${resourceId}
      RETURNING *
    `
    
    // Delete existing tags
    await sql`DELETE FROM resource_tags WHERE resource_id = ${resourceId}`
    
    // Insert new tags
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO resource_tags (resource_id, tag_id)
          VALUES (${resourceId}, ${tagId})
        `
      }
    }
    
    return NextResponse.json(resource)
  } catch (error) {
    console.error('Error updating resource:', error)
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = parseInt(params.id)
    
    await sql`DELETE FROM resources WHERE id = ${resourceId}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resource:', error)
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 })
  }
}
