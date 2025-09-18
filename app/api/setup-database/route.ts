import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Setting up database tables...')

    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)

    if (testError) {
      console.log('Direct table query failed, testing with basic connection...')

      // Try creating employees table by attempting to select from it
      const { error: employeesTestError } = await supabase
        .from('employees')
        .select('*')
        .limit(1)

      if (employeesTestError?.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Tables do not exist. Please create them manually in Supabase dashboard.',
          sql: `
-- Run this SQL in your Supabase SQL Editor:

-- employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    allowance_days NUMERIC(5,1) NOT NULL,
    region_code TEXT DEFAULT 'DE',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vacations table
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('google', 'company')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region_code, date, source)
);

-- settings table
CREATE TABLE IF NOT EXISTS settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    default_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    default_region_code TEXT DEFAULT 'DE',
    last_holiday_sync_at TIMESTAMPTZ,
    CHECK (id = 1)
);

-- Insert default settings
INSERT INTO settings (id, default_year, default_region_code)
VALUES (1, EXTRACT(YEAR FROM NOW()), 'DE')
ON CONFLICT (id) DO NOTHING;
          `
        })
      }

      // Tables might exist, let's check each one
      const tables = ['employees', 'vacations', 'holidays', 'settings']
      const tableStatus: Record<string, boolean> = {}

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        tableStatus[table] = !error
      }

      const missingTables = Object.entries(tableStatus)
        .filter(([_, exists]) => !exists)
        .map(([table]) => table)

      if (missingTables.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Missing tables: ${missingTables.join(', ')}`,
          tableStatus,
          sql: `
-- Run this SQL in your Supabase SQL Editor:

-- employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    allowance_days NUMERIC(5,1) NOT NULL,
    region_code TEXT DEFAULT 'DE',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vacations table
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('google', 'company')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region_code, date, source)
);

-- settings table
CREATE TABLE IF NOT EXISTS settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    default_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    default_region_code TEXT DEFAULT 'DE',
    last_holiday_sync_at TIMESTAMPTZ,
    CHECK (id = 1)
);

-- Insert default settings
INSERT INTO settings (id, default_year, default_region_code)
VALUES (1, EXTRACT(YEAR FROM NOW()), 'DE')
ON CONFLICT (id) DO NOTHING;
          `
        })
      }

      return NextResponse.json({
        success: true,
        message: 'All tables exist and are accessible',
        tableStatus
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful'
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function GET() {
  try {
    // Check table status
    const tables = ['employees', 'vacations', 'holidays', 'settings']
    const tableStatus: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        tableStatus[table] = !error
      } catch (e) {
        tableStatus[table] = false
      }
    }

    const allTablesExist = Object.values(tableStatus).every(exists => exists)

    return NextResponse.json({
      success: true,
      allTablesExist,
      tableStatus,
      message: allTablesExist ? 'All tables exist' : 'Some tables are missing'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}