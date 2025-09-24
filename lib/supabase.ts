import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Connection test function
export async function testConnection(): Promise<{
  ok: boolean
  connectionTime?: number
  tableStatus?: Record<string, boolean>
  error?: string
  details?: any
}> {
  const startTime = Date.now()

  try {
    console.log('🔄 Testing Supabase connection...')

    // Test basic connection
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true })

    const connectionTime = Date.now() - startTime

    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return {
        ok: false,
        connectionTime,
        error: error.message,
        details: error
      }
    }

    console.log('✅ Supabase connection successful')
    return {
      ok: true,
      connectionTime,
      tableStatus: {
        employees: true,
        vacations: true,
        holidays: true,
        settings: true
      }
    }
  } catch (error) {
    const connectionTime = Date.now() - startTime
    console.error('❌ Connection test failed:', error)
    return {
      ok: false,
      connectionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

// Check if required tables exist
export async function checkTablesExist(): Promise<{
  exists: boolean
  tables: Record<string, boolean>
  missing: string[]
}> {
  const requiredTables = ['employees', 'vacations', 'holidays', 'settings']
  const tables: Record<string, boolean> = {}
  const missing: string[] = []

  try {
    for (const table of requiredTables) {
      try {
        await supabase.from(table).select('*', { count: 'exact', head: true })
        tables[table] = true
      } catch (error) {
        tables[table] = false
        missing.push(table)
      }
    }

    return {
      exists: missing.length === 0,
      tables,
      missing
    }
  } catch (error) {
    console.error('❌ Failed to check tables:', error)

    // Mark all tables as missing if we can't check
    for (const table of requiredTables) {
      tables[table] = false
      missing.push(table)
    }

    return {
      exists: false,
      tables,
      missing
    }
  }
}