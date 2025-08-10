import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export { sql }

export interface TagCategory {
  id: number
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TagSubCategory {
  id: number
  name: string
  slug: string
  description: string | null
  category_id: number
  color: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TagTag {
  id: number
  name: string
  slug: string
  description: string | null
  category_id: number
  sub_category_id: number | null
  color: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompleteTagHierarchy {
  category_id: number
  category_name: string
  category_slug: string
  category_color: string
  sub_category_id: number | null
  sub_category_name: string | null
  sub_category_slug: string | null
  tag_id: number
  tag_name: string
  tag_slug: string
  effective_color: string
  full_path: string
}

export interface Resource {
  id: number
  submitted_by: string
  date: string
  title: string
  description: string | null
  "author/s": string | null
  url_link: string | null
  download_link: string | null
  linkedin_profile: string | null
  created_at: string
  updated_at: string
}

export interface ResourceWithTags extends Resource {
  tags: CompleteTagHierarchy[]
}

export interface TagHierarchy {
  [categoryName: string]: {
    id: number
    name: string
    slug: string
    color: string
    icon: string | null
    subcategories: {
      [subcategoryName: string]: {
        id: number
        name: string
        slug: string
        color: string | null
        icon: string | null
        tags: TagTag[]
      }
    }
  }
}
