import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export { sql }

export interface Resource {
  id: number
  submitted_by: string
  date: string
  title: string
  description: string | null
  url_link: string | null
  download_link: string | null
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export interface ResourceWithTags extends Resource {
  tags: Tag[]
}
