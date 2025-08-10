import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export interface Resource {
  id: number
  submitted_by: string
  date: string
  author: string | null
  title: string
  description?: string | null
  url_link?: string | null
  download_link?: string | null
  linkedin_profile?: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
  category?: string | null
  subcategory?: string | null
  created_at: string
  updated_at: string
}

export interface ResourceTag {
  resource_id: number
  tag_id: number
  created_at: string
}

export interface ResourceWithTags extends Resource {
  tags: Array<{
    tag_id: number
    name: string
    color: string
    category?: string | null
    subcategory?: string | null
  }>
}

export async function getResources(): Promise<ResourceWithTags[]> {
  try {
    // First get all resources
    const resources = await sql`
      SELECT 
        id,
        submitted_by,
        date,
        author,
        title,
        description,
        url_link,
        download_link,
        linkedin_profile,
        created_at,
        updated_at
      FROM resources 
      ORDER BY created_at DESC
    `

    // Then get all resource-tag relationships
    const resourceTags = await sql`
      SELECT 
        rt.resource_id,
        rt.tag_id,
        t.name,
        t.color,
        t.category,
        t.subcategory
      FROM resource_tags rt
      JOIN tags t ON rt.tag_id = t.id
    `

    // Merge the data in JavaScript
    const resourcesWithTags: ResourceWithTags[] = resources.map((resource) => ({
      ...resource,
      tags: resourceTags
        .filter((rt) => rt.resource_id === resource.id)
        .map((rt) => ({
          tag_id: rt.tag_id,
          name: rt.name,
          color: rt.color,
          category: rt.category,
          subcategory: rt.subcategory,
        })),
    }))

    return resourcesWithTags
  } catch (error) {
    console.error("Error fetching resources:", error)
    throw error
  }
}

export async function getResourceById(id: number): Promise<ResourceWithTags | null> {
  try {
    // Get the resource
    const resources = await sql`
      SELECT 
        id,
        submitted_by,
        date,
        author,
        title,
        description,
        url_link,
        download_link,
        linkedin_profile,
        created_at,
        updated_at
      FROM resources 
      WHERE id = ${id}
    `

    if (resources.length === 0) {
      return null
    }

    const resource = resources[0]

    // Get the tags for this resource
    const resourceTags = await sql`
      SELECT 
        rt.tag_id,
        t.name,
        t.color,
        t.category,
        t.subcategory
      FROM resource_tags rt
      JOIN tags t ON rt.tag_id = t.id
      WHERE rt.resource_id = ${id}
    `

    return {
      ...resource,
      tags: resourceTags.map((rt) => ({
        tag_id: rt.tag_id,
        name: rt.name,
        color: rt.color,
        category: rt.category,
        subcategory: rt.subcategory,
      })),
    }
  } catch (error) {
    console.error("Error fetching resource by id:", error)
    throw error
  }
}

export async function createResource(data: {
  submitted_by: string
  date: string
  author?: string
  title: string
  description?: string
  url_link?: string
  download_link?: string
  linkedin_profile?: string
}): Promise<Resource> {
  try {
    const result = await sql`
      INSERT INTO resources (
        submitted_by, 
        date, 
        author,
        title, 
        description, 
        url_link, 
        download_link,
        linkedin_profile,
        created_at, 
        updated_at
      )
      VALUES (
        ${data.submitted_by}, 
        ${data.date}, 
        ${data.author || null},
        ${data.title}, 
        ${data.description || null}, 
        ${data.url_link || null}, 
        ${data.download_link || null},
        ${data.linkedin_profile || null},
        NOW(), 
        NOW()
      )
      RETURNING *
    `
    return result[0] as Resource
  } catch (error) {
    console.error("Error creating resource:", error)
    throw error
  }
}

export async function updateResource(
  id: number,
  data: {
    submitted_by?: string
    date?: string
    author?: string
    title?: string
    description?: string
    url_link?: string
    download_link?: string
    linkedin_profile?: string
  },
): Promise<Resource> {
  try {
    const result = await sql`
      UPDATE resources 
      SET 
        submitted_by = COALESCE(${data.submitted_by}, submitted_by),
        date = COALESCE(${data.date}, date),
        author = COALESCE(${data.author}, author),
        title = COALESCE(${data.title}, title),
        description = COALESCE(${data.description}, description),
        url_link = COALESCE(${data.url_link}, url_link),
        download_link = COALESCE(${data.download_link}, download_link),
        linkedin_profile = COALESCE(${data.linkedin_profile}, linkedin_profile),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] as Resource
  } catch (error) {
    console.error("Error updating resource:", error)
    throw error
  }
}

export async function deleteResource(id: number): Promise<void> {
  try {
    // First delete the resource-tag relationships
    await sql`DELETE FROM resource_tags WHERE resource_id = ${id}`

    // Then delete the resource
    await sql`DELETE FROM resources WHERE id = ${id}`
  } catch (error) {
    console.error("Error deleting resource:", error)
    throw error
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT id, name, color, category, subcategory, created_at, updated_at
      FROM tags 
      ORDER BY category, subcategory, name
    `
    return result as Tag[]
  } catch (error) {
    console.error("Error fetching tags:", error)
    throw error
  }
}

export async function createTag(data: {
  name: string
  color: string
  category?: string
  subcategory?: string
}): Promise<Tag> {
  try {
    const result = await sql`
      INSERT INTO tags (name, color, category, subcategory, created_at, updated_at)
      VALUES (${data.name}, ${data.color}, ${data.category || null}, ${data.subcategory || null}, NOW(), NOW())
      RETURNING *
    `
    return result[0] as Tag
  } catch (error) {
    console.error("Error creating tag:", error)
    throw error
  }
}

export async function addTagsToResource(resourceId: number, tagIds: number[]): Promise<void> {
  try {
    // First remove existing tags
    await sql`DELETE FROM resource_tags WHERE resource_id = ${resourceId}`

    // Then add new tags
    if (tagIds.length > 0) {
      const values = tagIds.map((tagId) => `(${resourceId}, ${tagId}, NOW())`).join(", ")
      await sql.unsafe(`
        INSERT INTO resource_tags (resource_id, tag_id, created_at)
        VALUES ${values}
      `)
    }
  } catch (error) {
    console.error("Error adding tags to resource:", error)
    throw error
  }
}

export type TagTag = Tag
