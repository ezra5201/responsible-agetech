import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get("public") === "true"

    if (publicOnly) {
      // For public interface: only return tags that have associated resources
      const hierarchyData = await sql`
        SELECT DISTINCT cth.* 
        FROM complete_tag_hierarchy cth
        INNER JOIN resource_tags rt ON cth.tag_id = rt.tag_id
        INNER JOIN resources r ON rt.resource_id = r.id
        WHERE cth.tag_id IS NOT NULL
        ORDER BY cth.category_name, cth.sub_category_name, cth.tag_name
      `

      // Build the hierarchy structure with only tags that have resources
      const hierarchy: any = {}

      hierarchyData.forEach((row) => {
        const categoryName = row.category_name
        const subCategoryName = row.sub_category_name

        // Initialize category if it doesn't exist
        if (!hierarchy[categoryName]) {
          hierarchy[categoryName] = {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug,
            color: row.category_color,
            icon: null,
            subcategories: {},
          }
        }

        // Initialize subcategory if it doesn't exist
        if (subCategoryName && !hierarchy[categoryName].subcategories[subCategoryName]) {
          hierarchy[categoryName].subcategories[subCategoryName] = {
            id: row.sub_category_id,
            name: row.sub_category_name,
            slug: row.sub_category_slug,
            color: row.effective_color,
            icon: null,
            tags: [],
          }
        }

        // Add the tag
        if (subCategoryName) {
          hierarchy[categoryName].subcategories[subCategoryName].tags.push({
            id: row.tag_id,
            name: row.tag_name,
            slug: row.tag_slug,
            color: row.effective_color,
            category_id: row.category_id,
            sub_category_id: row.sub_category_id,
          })
        }
      })

      // Get flat list of tags with resources for backward compatibility
      const flatTags = await sql`
        SELECT DISTINCT tt.id, tt.name, tt.slug, tt.color, tt.category_id, tt.sub_category_id,
               tt.sort_order, tt.is_active, tt.created_at, tt.updated_at
        FROM tag_tags tt
        INNER JOIN resource_tags rt ON tt.id = rt.tag_id
        INNER JOIN resources r ON rt.resource_id = r.id
        WHERE tt.is_active = true
        ORDER BY tt.name
      `

      return NextResponse.json({
        flat: flatTags,
        hierarchy: hierarchy,
      })
    } else {
      // For admin interface: return all tags (existing logic)
      const hierarchyData = await sql`
        SELECT * FROM complete_tag_hierarchy 
        WHERE tag_id IS NOT NULL
        ORDER BY category_name, sub_category_name, tag_name
      `

      // Build the hierarchy structure
      const hierarchy: any = {}

      hierarchyData.forEach((row) => {
        const categoryName = row.category_name
        const subCategoryName = row.sub_category_name

        // Initialize category if it doesn't exist
        if (!hierarchy[categoryName]) {
          hierarchy[categoryName] = {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug,
            color: row.category_color,
            icon: null,
            subcategories: {},
          }
        }

        // Initialize subcategory if it doesn't exist
        if (subCategoryName && !hierarchy[categoryName].subcategories[subCategoryName]) {
          hierarchy[categoryName].subcategories[subCategoryName] = {
            id: row.sub_category_id,
            name: row.sub_category_name,
            slug: row.sub_category_slug,
            color: row.effective_color,
            icon: null,
            tags: [],
          }
        }

        // Add the tag
        if (subCategoryName) {
          hierarchy[categoryName].subcategories[subCategoryName].tags.push({
            id: row.tag_id,
            name: row.tag_name,
            slug: row.tag_slug,
            color: row.effective_color,
            category_id: row.category_id,
            sub_category_id: row.sub_category_id,
          })
        }
      })

      // Also get flat list of all tags for backward compatibility
      const flatTags = await sql`
        SELECT 
          id, name, slug, color, category_id, sub_category_id,
          sort_order, is_active, created_at, updated_at
        FROM tag_tags 
        WHERE is_active = true
        ORDER BY name
      `

      return NextResponse.json({
        flat: flatTags,
        hierarchy: hierarchy,
      })
    }
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color, category_id, sub_category_id } = await request.json()

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const [tag] = await sql`
      INSERT INTO tag_tags (name, slug, category_id, sub_category_id, color)
      VALUES (${name}, ${slug}, ${category_id}, ${sub_category_id || null}, ${color})
      RETURNING *
    `

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 })
  }
}
