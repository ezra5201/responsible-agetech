import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST() {
  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        submitted_by VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        url_link VARCHAR(1000),
        download_link VARCHAR(1000),
        linkedin_profile VARCHAR(1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS resource_tags (
        resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (resource_id, tag_id)
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_resources_date ON resources(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_resources_title ON resources(title)`
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_tags_resource ON resource_tags(resource_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_resource_tags_tag ON resource_tags(tag_id)`

    // Insert sample tags
    await sql`
      INSERT INTO tags (name, color) VALUES 
        ('Public Health', '#10B981'),
        ('Academic Research', '#3B82F6'),
        ('African Studies', '#F59E0B'),
        ('Education', '#8B5CF6'),
        ('Books', '#EF4444'),
        ('Gerontology', '#06B6D4'),
        ('Sub-Saharan Africa', '#F59E0B'),
        ('Doctoral Education', '#8B5CF6'),
        ('Health Disparities', '#10B981'),
        ('University Research', '#3B82F6')
      ON CONFLICT (name) DO NOTHING
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully' 
    })
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      error: 'Database setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
