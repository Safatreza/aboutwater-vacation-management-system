import { NextResponse } from 'next/server'
import { testConnection, checkTablesExist } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 Starting Supabase connection test...')

    // Test basic connection
    const connectionResult = await testConnection()
    console.log('Connection result:', connectionResult)

    // Check if tables exist
    const tablesResult = await checkTablesExist()
    console.log('Tables result:', tablesResult)

    return NextResponse.json({
      ok: true,
      message: 'Supabase connection test completed',
      connection: connectionResult,
      tables: tablesResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Supabase test failed:', error)

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}