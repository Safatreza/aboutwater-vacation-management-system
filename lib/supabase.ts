import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-key'

// Only validate during actual runtime, not during build
if (typeof window === 'undefined' && process.env.VERCEL_ENV) {
  console.log('🔄 Initializing Supabase connection...')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)

  if (supabaseAnonKey && supabaseAnonKey !== 'placeholder-key') {
    console.log(`🔑 Anon Key Length: ${supabaseAnonKey.length} characters`)
  }

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is missing - using placeholder for build')
  } else if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is missing - using placeholder for build')
  } else {
    console.log('✅ Supabase environment variables configured')
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

// Comprehensive connection and database health check
export async function testConnection(): Promise<{
  ok: boolean
  connectionTime?: number
  tableStatus?: Record<string, boolean>
  error?: string
  details?: any
}> {
  const startTime = Date.now()
  
  try {
    console.log('🧪 Testing Supabase connection...')
    
    // Test basic connection with a simple query
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError)
      return { 
        ok: false, 
        error: `Connection failed: ${connectionError.message}`,
        details: connectionError
      }
    }
    
    const connectionTime = Date.now() - startTime
    console.log(`✅ Connection successful in ${connectionTime}ms`)
    
    // Test table access for each required table
    const requiredTables = ['employees', 'vacations', 'holidays', 'settings']
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of requiredTables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        tableStatus[table] = !tableError
        if (tableError) {
          console.warn(`⚠️  Table '${table}' not accessible:`, tableError.message)
        } else {
          console.log(`✅ Table '${table}' accessible`)
        }
      } catch (error) {
        tableStatus[table] = false
        console.warn(`⚠️  Table '${table}' test failed:`, error)
      }
    }
    
    return { 
      ok: true,
      connectionTime,
      tableStatus
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown database error',
      connectionTime: Date.now() - startTime,
      details: error
    }
  }
}

// Check if tables exist
export async function checkTablesExist(): Promise<{
  exists: boolean
  tables: Record<string, boolean>
  missing: string[]
}> {
  try {
    const { data: allTables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) throw error
    
    const existingTableNames = (allTables || []).map((t: any) => t.table_name)
    const requiredTables = ['employees', 'vacations', 'holidays', 'settings']
    
    const tables: Record<string, boolean> = {}
    const missing: string[] = []
    
    for (const table of requiredTables) {
      const exists = existingTableNames.includes(table)
      tables[table] = exists
      if (!exists) missing.push(table)
    }
    
    return {
      exists: missing.length === 0,
      tables,
      missing
    }
  } catch (error) {
    console.error('Error checking tables:', error)
    return {
      exists: false,
      tables: {},
      missing: ['employees', 'vacations', 'holidays', 'settings']
    }
  }
}
