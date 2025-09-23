const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://loggvhlcmaipmeeoqifi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ2d2aGxjbWFpcG1lZW9xaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTA4MTYsImV4cCI6MjA3MzM2NjgxNn0.yV4LuhnP1ABb7i597NI4q7DXFnIXC67blPQ3KjGzIHQ'

async function createTablesManually() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('🔧 Creating tables manually...')

  try {
    // Since we can't execute raw SQL with the anon key, let's try to create tables by attempting operations
    // First, let's try to insert some test data to check if tables exist

    console.log('1. Testing employees table...')
    try {
      // Try to create an employee
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          name: 'Test Employee',
          email: 'test@aboutwater.de',
          allowance_days: 25,
          region_code: 'DE'
        }])
        .select()

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ employees table does not exist')
        } else {
          console.log('✅ employees table exists but insert failed:', error.message)
        }
      } else {
        console.log('✅ employees table exists and working')
        // Clean up test data
        if (data && data.length > 0) {
          await supabase.from('employees').delete().eq('id', data[0].id)
        }
      }
    } catch (e) {
      console.log('❌ employees table error:', e.message)
    }

    console.log('2. Testing holidays table...')
    try {
      const { data, error } = await supabase
        .from('holidays')
        .insert([{
          region_code: 'DE',
          date: '2024-12-31',
          name: 'Test Holiday',
          source: 'system'
        }])
        .select()

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ holidays table does not exist')
        } else {
          console.log('✅ holidays table exists but insert failed:', error.message)
        }
      } else {
        console.log('✅ holidays table exists and working')
        // Clean up test data
        if (data && data.length > 0) {
          await supabase.from('holidays').delete().eq('id', data[0].id)
        }
      }
    } catch (e) {
      console.log('❌ holidays table error:', e.message)
    }

    console.log('3. Testing settings table...')
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ settings table does not exist')
        } else {
          console.log('⚠️ settings table exists but query failed:', error.message)
        }
      } else {
        console.log('✅ settings table exists and working')
        console.log('Settings data:', data)
      }
    } catch (e) {
      console.log('❌ settings table error:', e.message)
    }

    console.log('4. Testing vacations table...')
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .limit(1)

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ vacations table does not exist')
        } else {
          console.log('⚠️ vacations table exists but query failed:', error.message)
        }
      } else {
        console.log('✅ vacations table exists and working')
      }
    } catch (e) {
      console.log('❌ vacations table error:', e.message)
    }

    console.log('\n📋 NEXT STEPS:')
    console.log('Since we cannot create tables via the anon API key, please:')
    console.log('1. Go to: https://supabase.com/dashboard/project/loggvhlcmaipmeeoqifi')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste this SQL:')
    console.log('\n--- START SQL ---')
    console.log(`-- AboutWater GmbH Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    allowance_days NUMERIC(5,1) NOT NULL DEFAULT 25.0,
    used_days NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    region_code TEXT DEFAULT 'DE',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vacations table
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'annual_leave',
    status TEXT NOT NULL DEFAULT 'approved',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code TEXT NOT NULL DEFAULT 'DE',
    date DATE NOT NULL,
    name TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region_code, date, name)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    default_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    default_region_code TEXT DEFAULT 'DE',
    company_name TEXT DEFAULT 'AboutWater GmbH',
    notification_email TEXT DEFAULT 'safat.majumder@aboutwater.de',
    last_holiday_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_policy ON employees FOR ALL USING (true);
CREATE POLICY vacations_policy ON vacations FOR ALL USING (true);
CREATE POLICY holidays_policy ON holidays FOR ALL USING (true);
CREATE POLICY settings_policy ON settings FOR ALL USING (true);

-- Insert default settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert basic German holidays for 2024-2025
INSERT INTO holidays (region_code, date, name, source) VALUES
    ('DE', '2024-01-01', 'Neujahr', 'system'),
    ('DE', '2024-03-29', 'Karfreitag', 'system'),
    ('DE', '2024-04-01', 'Ostermontag', 'system'),
    ('DE', '2024-05-01', 'Tag der Arbeit', 'system'),
    ('DE', '2024-05-09', 'Christi Himmelfahrt', 'system'),
    ('DE', '2024-05-20', 'Pfingstmontag', 'system'),
    ('DE', '2024-10-03', 'Tag der Deutschen Einheit', 'system'),
    ('DE', '2024-12-25', '1. Weihnachtstag', 'system'),
    ('DE', '2024-12-26', '2. Weihnachtstag', 'system'),
    ('DE', '2025-01-01', 'Neujahr', 'system'),
    ('DE', '2025-04-18', 'Karfreitag', 'system'),
    ('DE', '2025-04-21', 'Ostermontag', 'system'),
    ('DE', '2025-05-01', 'Tag der Arbeit', 'system'),
    ('DE', '2025-05-29', 'Christi Himmelfahrt', 'system'),
    ('DE', '2025-06-09', 'Pfingstmontag', 'system'),
    ('DE', '2025-10-03', 'Tag der Deutschen Einheit', 'system'),
    ('DE', '2025-12-25', '1. Weihnachtstag', 'system'),
    ('DE', '2025-12-26', '2. Weihnachtstag', 'system')
ON CONFLICT (region_code, date, name) DO NOTHING;`)
    console.log('--- END SQL ---\n')
    console.log('4. Click "Run" to execute')
    console.log('5. After execution, run this script again to verify')

  } catch (error) {
    console.error('Error during table creation test:', error)
  }
}

createTablesManually()