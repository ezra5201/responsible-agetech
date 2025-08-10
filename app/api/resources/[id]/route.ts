import { type NextRequest, NextResponse } from "next/server"
import { getResourceById, updateResource, deleteResource, addTagsToResource } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 })
    }

    const resource = await getResourceById(id)
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Error in GET /api/resources/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 })
    }

    const body = await request.json()
    const { submitted_by, date, title, description, url_link, download_link, linkedin_profile, author, tagIds } = body

    // Update the resource
    const resource = await updateResource(id, {
      submitted_by: submitted_by,
      date: date,
      author: author,
      title: title,
      description: description,
      url_link: url_link,
      download_link: download_link,
      linkedin_profile: linkedin_profile,
    })

    // Update tags if provided
    if (tagIds && Array.isArray(tagIds)) {
      await addTagsToResource(id, tagIds)
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Error in PUT /api/resources/[id]:", error)
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 })
    }

    await deleteResource(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/resources/[id]:", error)
    return NextResponse.json({ error: "Failed to delete resource" }, { status: 500 })
  }
}
