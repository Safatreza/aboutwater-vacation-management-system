// Mock implementation for Supabase - uses in-memory storage instead

console.log('✅ Using in-memory storage (no database required)')

// Mock connection test that always succeeds
export async function testConnection(): Promise<{
  ok: boolean
  connectionTime?: number
  tableStatus?: Record<string, boolean>
  error?: string
  details?: any
}> {
  console.log('🧪 Mock connection test - always succeeds')

  return {
    ok: true,
    connectionTime: 5,
    tableStatus: {
      employees: true,
      vacations: true,
      holidays: true,
      settings: true
    }
  }
}

// Mock table check that always succeeds
export async function checkTablesExist(): Promise<{
  exists: boolean
  tables: Record<string, boolean>
  missing: string[]
}> {
  console.log('🧪 Mock table check - all tables exist')

  return {
    exists: true,
    tables: {
      employees: true,
      vacations: true,
      holidays: true,
      settings: true
    },
    missing: []
  }
}

// Mock supabase client (not used by APIs anymore)
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null })
  })
}
