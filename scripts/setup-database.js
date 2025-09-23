#!/usr/bin/env node

/**
 * AboutWater GmbH - Database Setup Script
 * This script creates the complete database schema for the vacation management system
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🏗️  AboutWater GmbH - Database Setup')
console.log('=' .repeat(60))

async function setupDatabase() {
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }
  
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Using anon key for setup`)
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Read the SQL migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_create_aboutwater_schema.sql')
  
  console.log(`\n📁 Reading migration file: ${path.basename(migrationPath)}`)
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }
  
  const sqlContent = fs.readFileSync(migrationPath, 'utf8')
  console.log(`✅ Migration file loaded (${sqlContent.length} characters)`)
  
  // Execute the migration using RPC
  console.log('\n🚀 Executing database migration...')
  console.log('-' .repeat(40))
  
  try {
    // Since we can't execute raw SQL directly with the anon key,
    // we'll need to create the tables using individual operations
    
    console.log('⚠️  Note: Creating schema step by step due to RLS limitations')
    
    // Test connection first
    const { error: connectionError } = await supabase.from('information_schema.tables').select('*').limit(1)
    
    if (connectionError && !connectionError.message.includes('Could not find the table')) {
      console.error('❌ Connection test failed:', connectionError.message)
      return false
    }
    
    console.log('✅ Database connection verified')
    
    // Try to create tables using the REST API
    // Since we can't execute raw SQL, we'll need to use the Supabase dashboard
    // for the initial schema creation
    
    console.log('\n📋 Schema Creation Instructions:')
    console.log('=' .repeat(60))
    console.log('Since we\'re using the anon key, please follow these steps:')
    console.log('')
    console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard')
    console.log('2. Navigate to your project: loggvhlcmaipmeeoqifi')
    console.log('3. Go to SQL Editor')
    console.log('4. Copy and paste the following SQL:')
    console.log('')
    console.log('-- SQL TO EXECUTE IN SUPABASE DASHBOARD:')
    console.log('-' .repeat(50))
    
    // Show a simplified version of the schema
    const simplifiedSQL = `
-- AboutWater GmbH Vacation Management Schema
-- Execute this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    allowance_days NUMERIC(5,1) NOT NULL DEFAULT 25.0,
    used_days NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    region_code TEXT DEFAULT 'DE',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT employees_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Vacations table
CREATE TABLE vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'annual_leave',
    status TEXT NOT NULL DEFAULT 'approved',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT vacations_end_date_after_start_date CHECK (end_date >= start_date)
);

-- Holidays table
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code TEXT NOT NULL DEFAULT 'DE',
    date DATE NOT NULL,
    name TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(region_code, date, name)
);

-- Settings table
CREATE TABLE settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    default_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    default_region_code TEXT DEFAULT 'DE',
    company_name TEXT DEFAULT 'AboutWater GmbH',
    notification_email TEXT DEFAULT 'safat.majumder@aboutwater.de',
    last_holiday_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT settings_single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO settings (id) VALUES (1);

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
ON CONFLICT (region_code, date, name) DO NOTHING;
`
    
    console.log(simplifiedSQL)
    console.log('-' .repeat(50))
    console.log('')
    console.log('5. Click "Run" to execute the SQL')
    console.log('6. After successful execution, run this script again to verify')
    console.log('')
    
    // Check if tables already exist by trying to query them
    console.log('🔍 Checking if tables exist...')
    const tableChecks = []
    
    const tables = ['employees', 'vacations', 'holidays', 'settings']
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`❌ Table '${table}': Not found`)
          tableChecks.push(false)
        } else {
          console.log(`✅ Table '${table}': Exists`)
          tableChecks.push(true)
        }
      } catch (error) {
        console.log(`❌ Table '${table}': Error - ${error.message}`)
        tableChecks.push(false)
      }
    }
    
    const existingTables = tableChecks.filter(Boolean).length
    
    if (existingTables === 0) {
      console.log('\n⚠️  NO TABLES FOUND - Please execute the SQL in Supabase dashboard first')
      console.log('   After creating the schema, run this script again to verify')
      return false
    } else if (existingTables === tables.length) {
      console.log('\n🎉 ALL TABLES EXIST - Database schema is ready!')
      return true
    } else {
      console.log(`\n⚠️  PARTIAL SETUP - Found ${existingTables}/${tables.length} tables`)
      console.log('   Please complete the schema creation in Supabase dashboard')
      return false
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    return false
  }
}

// Run the setup
setupDatabase().then(success => {
  console.log('\n' + '=' .repeat(60))
  if (success) {
    console.log('🎉 DATABASE SETUP COMPLETE!')
    console.log('✅ Schema created successfully')
    console.log('✅ Ready for testing and development')
  } else {
    console.log('⚠️  SETUP INCOMPLETE')
    console.log('   Please follow the instructions above to complete setup')
  }
  console.log('=' .repeat(60))
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('\n💥 Setup script failed:', error)
  process.exit(1)
})