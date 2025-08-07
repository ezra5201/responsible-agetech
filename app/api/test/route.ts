import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'DATABASE_URL environment variable is not set',
        status: 'configuration_error'
      }, { status: 500 })
    }

    // Test basic database connection
    const result = await sql`SELECT 1 as test`
    
    // Test if tables exist
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('resources', 'tags', 'resource_tags')
    `
    
    return NextResponse.json({
      status: 'success',
      database_connected: true,
      tables_found: tablesCheck.map(t => t.table_name),
      test_query: result[0]
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      status: 'error',
      database_connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }, { status: 500 })
  }
}
