import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      submitted_by,
      date,
      title,
      description,
      author,
      url_link,
      download_link,
      linkedin_profile,
      submitter_email,
      tagIds,
    } = body
    const resourceId = Number.parseInt(params.id)

    // Check if linkedin_profile column exists
    const columnExists = await sql`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' 
        AND column_name = 'linkedin_profile'
      ) as exists
    `

    // Check if submitter_email column exists
    const emailColumnExists = await sql`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' 
        AND column_name = 'submitter_email'
      ) as exists
    `

    let resource

    if (columnExists[0].exists && emailColumnExists[0].exists) {
      // Update with both linkedin_profile and submitter_email columns
      ;[resource] = await sql`
        UPDATE resources 
        SET submitted_by = ${submitted_by}, date = ${date}, title = ${title}, 
            description = ${description}, "author/s" = ${author}, url_link = ${url_link}, 
            download_link = ${download_link}, linkedin_profile = ${linkedin_profile},
            submitter_email = ${submitter_email}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${resourceId}
        RETURNING *
      `
    } else if (columnExists[0].exists) {
      // Update with linkedin_profile column only
      ;[resource] = await sql`
        UPDATE resources 
        SET submitted_by = ${submitted_by}, date = ${date}, title = ${title}, 
            description = ${description}, "author/s" = ${author}, url_link = ${url_link}, 
            download_link = ${download_link}, linkedin_profile = ${linkedin_profile},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${resourceId}
        RETURNING *
      `
      resource.submitter_email = null
    } else {
      // Update without linkedin_profile or submitter_email columns
      ;[resource] = await sql`
        UPDATE resources 
        SET submitted_by = ${submitted_by}, date = ${date}, title = ${title}, 
            description = ${description}, "author/s" = ${author}, url_link = ${url_link}, 
            download_link = ${download_link}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${resourceId}
        RETURNING *
      `
      resource.linkedin_profile = null
      resource.submitter_email = null
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, reviewed_by, review_notes } = body
    const resourceId = Number.parseInt(params.id)

    // Validate status
    const validStatuses = ["draft", "pending_review", "published", "rejected"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const [resource] = await sql`
      UPDATE resources 
      SET status = ${status}, 
          reviewed_by = ${reviewed_by || null}, 
          review_notes = ${review_notes || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${resourceId}
      RETURNING *
    `

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Error updating resource status:", error)
    return NextResponse.json({ error: "Failed to update resource status" }, { status: 500 })
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
