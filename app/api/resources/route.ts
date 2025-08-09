import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
    const sortBy = searchParams.get("sortBy") || "date"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Validate sortBy parameter and create ORDER BY clause
    let orderByClause = "ORDER BY r.date DESC" // Default
    if (sortBy === "title") {
      orderByClause = sortOrder.toLowerCase() === "asc" ? "ORDER BY r.title ASC" : "ORDER BY r.title DESC"
    } else if (sortBy === "submitted_by") {
      orderByClause = sortOrder.toLowerCase() === "asc" ? "ORDER BY r.submitted_by ASC" : "ORDER BY r.submitted_by DESC"
    } else if (sortBy === "created_at") {
      orderByClause = sortOrder.toLowerCase() === "asc" ? "ORDER BY r.created_at ASC" : "ORDER BY r.created_at DESC"
    } else {
      // Default to date
      orderByClause = sortOrder.toLowerCase() === "asc" ? "ORDER BY r.date ASC" : "ORDER BY r.date DESC"
    }

    let resources

    if (tags.length > 0) {
      // Query with tag filtering - simplified approach
      const resourcesWithTags = await sql`
        SELECT DISTINCT r.id, r.submitted_by, r.date, r.title, r.description, 
               r.url_link, r.download_link, r.linkedin_profile, r.created_at, r.updated_at
        FROM resources r
        INNER JOIN resource_tags rt ON r.id = rt.resource_id
        INNER JOIN complete_tag_hierarchy cth ON rt.tag_id = cth.tag_id
        WHERE cth.tag_name = ANY(${tags})
      `

      // Get tags for each resource separately
      const resourceIds = resourcesWithTags.map((r) => r.id)

      if (resourceIds.length > 0) {
        const allTags = await sql`
          SELECT rt.resource_id,
                 cth.tag_id, cth.tag_name, cth.tag_slug,
                 cth.category_name, cth.sub_category_name,
                 cth.effective_color, cth.full_path
          FROM resource_tags rt
          INNER JOIN complete_tag_hierarchy cth ON rt.tag_id = cth.tag_id
          WHERE rt.resource_id = ANY(${resourceIds})
          ORDER BY cth.category_name, cth.sub_category_name, cth.tag_name
        `

        // Group tags by resource
        const tagsByResource = allTags.reduce((acc, tag) => {
          if (!acc[tag.resource_id]) {
            acc[tag.resource_id] = []
          }
          acc[tag.resource_id].push({
            tag_id: tag.tag_id,
            tag_name: tag.tag_name,
            tag_slug: tag.tag_slug,
            category_name: tag.category_name,
            sub_category_name: tag.sub_category_name,
            effective_color: tag.effective_color,
            full_path: tag.full_path,
          })
          return acc
        }, {})

        // Combine resources with their tags
        resources = resourcesWithTags.map((resource) => ({
          ...resource,
          tags: tagsByResource[resource.id] || [],
        }))

        // Apply sorting
        resources.sort((a, b) => {
          if (sortBy === "title") {
            const comparison = a.title.localeCompare(b.title)
            return sortOrder === "asc" ? comparison : -comparison
          } else if (sortBy === "submitted_by") {
            const comparison = a.submitted_by.localeCompare(b.submitted_by)
            return sortOrder === "asc" ? comparison : -comparison
          } else if (sortBy === "created_at") {
            const comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            return sortOrder === "asc" ? comparison : -comparison
          } else {
            // Default to date
            const comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
            return sortOrder === "asc" ? comparison : -comparison
          }
        })
      } else {
        resources = []
      }
    } else {
      // Query without tag filtering - simplified approach
      const allResources = await sql`
        SELECT r.id, r.submitted_by, r.date, r.title, r.description, 
               r.url_link, r.download_link, r.linkedin_profile, r.created_at, r.updated_at
        FROM resources r
      `

      // Get all tags for all resources
      const resourceIds = allResources.map((r) => r.id)

      let allTags = []
      if (resourceIds.length > 0) {
        allTags = await sql`
          SELECT rt.resource_id,
                 cth.tag_id, cth.tag_name, cth.tag_slug,
                 cth.category_name, cth.sub_category_name,
                 cth.effective_color, cth.full_path
          FROM resource_tags rt
          INNER JOIN complete_tag_hierarchy cth ON rt.tag_id = cth.tag_id
          WHERE rt.resource_id = ANY(${resourceIds})
          ORDER BY cth.category_name, cth.sub_category_name, cth.tag_name
        `
      }

      // Group tags by resource
      const tagsByResource = allTags.reduce((acc, tag) => {
        if (!acc[tag.resource_id]) {
          acc[tag.resource_id] = []
        }
        acc[tag.resource_id].push({
          tag_id: tag.tag_id,
          tag_name: tag.tag_name,
          tag_slug: tag.tag_slug,
          category_name: tag.category_name,
          sub_category_name: tag.sub_category_name,
          effective_color: tag.effective_color,
          full_path: tag.full_path,
        })
        return acc
      }, {})

      // Combine resources with their tags
      resources = allResources.map((resource) => ({
        ...resource,
        tags: tagsByResource[resource.id] || [],
      }))

      // Apply sorting
      resources.sort((a, b) => {
        if (sortBy === "title") {
          const comparison = a.title.localeCompare(b.title)
          return sortOrder === "asc" ? comparison : -comparison
        } else if (sortBy === "submitted_by") {
          const comparison = a.submitted_by.localeCompare(b.submitted_by)
          return sortOrder === "asc" ? comparison : -comparison
        } else if (sortBy === "created_at") {
          const comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          return sortOrder === "asc" ? comparison : -comparison
        } else {
          // Default to date
          const comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          return sortOrder === "asc" ? comparison : -comparison
        }
      })
    }

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Detailed error fetching resources:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch resources",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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
    console.error("Error creating resource:", error)
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 })
  }
}
