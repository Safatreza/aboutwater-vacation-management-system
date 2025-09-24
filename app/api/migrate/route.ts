import { NextResponse } from 'next/server'
import { migration } from '@/lib/supabaseStorage'
import { testConnection } from '@/lib/supabase'

// GET /api/migrate - Test migration status and run migration if needed
export async function GET() {
  try {
    console.log('🔄 Starting migration check...')

    // Test connection first
    const connectionTest = await testConnection()
    console.log('Connection test result:', connectionTest)

    if (!connectionTest.ok) {
      return NextResponse.json({
        ok: false,
        error: 'Database connection failed',
        details: connectionTest
      }, { status: 500 })
    }

    // Check if we need to migrate data from localStorage
    if (typeof window === 'undefined') {
      return NextResponse.json({
        ok: true,
        message: 'Migration can only be run in browser context',
        connection: connectionTest
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Database connection successful',
      connection: connectionTest
    })

  } catch (error) {
    console.error('❌ Migration check failed:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}

// POST /api/migrate - Run data migration from localStorage to Supabase
export async function POST() {
  try {
    console.log('🔄 Starting data migration from localStorage...')

    const result = await migration.importFromLocalStorage()

    console.log('✅ Migration completed:', result)

    return NextResponse.json({
      ok: true,
      message: 'Migration completed successfully',
      migrated: result
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}