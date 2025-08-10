import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { submitted_by, date, title, description, author, url_link, download_link, linkedin_profile, tagIds } = body
    const resourceId = Number.parseInt(params.id)

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
      // Update with linkedin_profile column
      ;[resource] = await sql`
        UPDATE resources 
        SET submitted_by = ${submitted_by}, date = ${date}, title = ${title}, 
            description = ${description}, author = ${author}, url_link = ${url_link}, 
            download_link = ${download_link}, linkedin_profile = ${linkedin_profile},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${resourceId}
        RETURNING *
      `
    } else {
      // Update without linkedin_profile column
      ;[resource] = await sql`
        UPDATE resources 
        SET submitted_by = ${submitted_by}, date = ${date}, title = ${title}, 
            description = ${description}, author = ${author}, url_link = ${url_link}, 
            download_link = ${download_link},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${resourceId}
        RETURNING *
      `
      // Add linkedin_profile as null for consistency
      resource.linkedin_profile = null
    }

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
    console.error("Error updating resource:", error)
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resourceId = Number.parseInt(params.id)

    await sql`DELETE FROM resources WHERE id = ${resourceId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}
