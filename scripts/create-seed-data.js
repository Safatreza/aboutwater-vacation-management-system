#!/usr/bin/env node

/**
 * AboutWater GmbH - Seed Data Creation Script
 * Creates realistic sample data for development and testing
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🌱 AboutWater GmbH - Seed Data Creation')
console.log('=' .repeat(60))

// Sample employee data
const sampleEmployees = [
  { name: 'Max Mustermann', email: 'max.mustermann@aboutwater.de', allowance_days: 30, used_days: 12 },
  { name: 'Anna Schmidt', email: 'anna.schmidt@aboutwater.de', allowance_days: 28, used_days: 8 },
  { name: 'Thomas Weber', email: 'thomas.weber@aboutwater.de', allowance_days: 25, used_days: 15 },
  { name: 'Maria Gonzalez', email: 'maria.gonzalez@aboutwater.de', allowance_days: 27, used_days: 5 },
  { name: 'Lukas Fischer', email: 'lukas.fischer@aboutwater.de', allowance_days: 30, used_days: 18 },
  { name: 'Petra Müller', email: 'petra.mueller@aboutwater.de', allowance_days: 25, used_days: 10 },
  { name: 'Safat Majumder', email: 'safat.majumder@aboutwater.de', allowance_days: 30, used_days: 7 }
]

// Sample vacation data (will be created after employees)
const sampleVacations = [
  { employeeIndex: 0, start_date: '2024-12-23', end_date: '2024-12-27', type: 'annual_leave', note: 'Christmas vacation' },
  { employeeIndex: 0, start_date: '2024-07-15', end_date: '2024-07-26', type: 'annual_leave', note: 'Summer holiday' },
  { employeeIndex: 1, start_date: '2024-08-12', end_date: '2024-08-16', type: 'annual_leave', note: 'Family vacation' },
  { employeeIndex: 1, start_date: '2024-11-04', end_date: '2024-11-05', type: 'personal_leave', note: 'Personal days' },
  { employeeIndex: 2, start_date: '2024-09-16', end_date: '2024-09-27', type: 'annual_leave', note: 'Fall vacation' },
  { employeeIndex: 2, start_date: '2024-12-30', end_date: '2025-01-02', type: 'annual_leave', note: 'New Year break' },
  { employeeIndex: 3, start_date: '2024-06-10', end_date: '2024-06-14', type: 'annual_leave', note: 'Spring break' },
  { employeeIndex: 4, start_date: '2024-08-05', end_date: '2024-08-16', type: 'annual_leave', note: 'Summer vacation' },
  { employeeIndex: 4, start_date: '2024-12-23', end_date: '2024-12-24', type: 'personal_leave', note: 'Christmas shopping' },
  { employeeIndex: 5, start_date: '2024-10-14', end_date: '2024-10-18', type: 'annual_leave', note: 'Autumn holiday' },
  { employeeIndex: 6, start_date: '2024-11-25', end_date: '2024-11-29', type: 'annual_leave', note: 'Thanksgiving week' }
]

async function createSeedData() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  console.log('🔍 Checking database connection...')
  
  // Test connection
  try {
    const { data, error } = await supabase.from('employees').select('count').limit(1)
    if (error) throw error
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('   Make sure you have created the database schema first')
    console.error('   Run: node scripts/setup-database.js')
    process.exit(1)
  }
  
  // Check if seed data already exists
  console.log('\n🔍 Checking for existing data...')
  
  try {
    const { data: existingEmployees, error } = await supabase
      .from('employees')
      .select('id, name, email')
      .limit(10)
    
    if (error) throw error
    
    if (existingEmployees && existingEmployees.length > 0) {
      console.log(`📋 Found ${existingEmployees.length} existing employees:`)
      existingEmployees.forEach(emp => {
        console.log(`   - ${emp.name} (${emp.email})`)
      })
      
      console.log('\n⚠️  Seed data already exists. Do you want to:')
      console.log('   1. Keep existing data (recommended)')
      console.log('   2. Add additional sample data')
      console.log('   3. Replace all data (destructive)')
      console.log('\nFor safety, we\'ll keep existing data and add samples if needed.')
      
      // Check if we have AboutWater-specific employees
      const aboutwaterEmployees = existingEmployees.filter(emp => 
        emp.email && emp.email.includes('@aboutwater.de')
      )
      
      if (aboutwaterEmployees.length >= sampleEmployees.length) {
        console.log('\n✅ Sufficient seed data already exists')
        console.log('   Database is ready for development and testing')
        return true
      }
    }
  } catch (error) {
    console.log('⚠️  Could not check existing data:', error.message)
  }
  
  // Create employees
  console.log('\n👥 Creating sample employees...')
  const createdEmployeeIds = []
  
  for (const employee of sampleEmployees) {
    try {
      // Check if employee already exists
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('email', employee.email)
        .single()
      
      if (existing) {
        console.log(`⚠️  Employee ${employee.name} already exists, skipping`)
        createdEmployeeIds.push(existing.id)
        continue
      }
      
      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert({
          name: employee.name,
          email: employee.email,
          allowance_days: employee.allowance_days,
          used_days: employee.used_days,
          region_code: 'DE',
          active: true
        })
        .select('id')
        .single()
      
      if (error) throw error
      
      createdEmployeeIds.push(newEmployee.id)
      console.log(`✅ Created employee: ${employee.name}`)
      
    } catch (error) {
      console.log(`❌ Failed to create employee ${employee.name}:`, error.message)
    }
  }
  
  console.log(`\n📊 Employee creation summary: ${createdEmployeeIds.length}/${sampleEmployees.length} successful`)
  
  // Create vacations
  if (createdEmployeeIds.length > 0) {
    console.log('\n🏖️  Creating sample vacations...')
    let createdVacations = 0
    
    for (const vacation of sampleVacations) {
      if (vacation.employeeIndex >= createdEmployeeIds.length) continue
      
      const employeeId = createdEmployeeIds[vacation.employeeIndex]
      
      try {
        const { error } = await supabase
          .from('vacations')
          .insert({
            employee_id: employeeId,
            start_date: vacation.start_date,
            end_date: vacation.end_date,
            type: vacation.type,
            status: 'approved',
            note: vacation.note
          })
        
        if (error) throw error
        
        createdVacations++
        console.log(`✅ Created vacation: ${vacation.start_date} - ${vacation.end_date}`)
        
      } catch (error) {
        console.log(`❌ Failed to create vacation:`, error.message)
      }
    }
    
    console.log(`\n📊 Vacation creation summary: ${createdVacations} vacations created`)
  }
  
  // Verify holidays exist
  console.log('\n🎄 Checking holidays...')
  
  try {
    const { data: holidays, error } = await supabase
      .from('holidays')
      .select('count')
      .eq('region_code', 'DE')
    
    if (error) throw error
    
    const holidayCount = holidays?.[0]?.count || 0
    
    if (holidayCount > 0) {
      console.log(`✅ Found ${holidayCount} German holidays`)
    } else {
      console.log('⚠️  No holidays found - they should be created during schema setup')
    }
  } catch (error) {
    console.log('⚠️  Could not check holidays:', error.message)
  }
  
  // Final verification
  console.log('\n🔍 Final verification...')
  
  try {
    const { data: finalCount } = await supabase
      .from('employees')
      .select('id')
    
    const { data: vacationCount } = await supabase
      .from('vacations')
      .select('id')
    
    const { data: holidayCount } = await supabase
      .from('holidays')
      .select('id')
    
    console.log('\n📊 Database Summary:')
    console.log(`   👥 Employees: ${finalCount?.length || 0}`)
    console.log(`   🏖️  Vacations: ${vacationCount?.length || 0}`)
    console.log(`   🎄 Holidays: ${holidayCount?.length || 0}`)
    
    const hasMinimumData = (finalCount?.length || 0) >= 3 && 
                          (vacationCount?.length || 0) >= 3 &&
                          (holidayCount?.length || 0) >= 10
    
    if (hasMinimumData) {
      console.log('\n🎉 SEED DATA CREATION COMPLETE!')
      console.log('✅ Database has sufficient sample data for development')
      console.log('✅ Ready for testing and demonstration')
    } else {
      console.log('\n⚠️  SEED DATA INCOMPLETE')
      console.log('   Some tables may not have sufficient data')
    }
    
    return hasMinimumData
    
  } catch (error) {
    console.log('❌ Final verification failed:', error.message)
    return false
  }
}

// Run seed data creation
createSeedData().then(success => {
  console.log('\n' + '=' .repeat(60))
  if (success) {
    console.log('🌱 Seed data creation successful!')
    console.log('   Your database is now ready for development and testing')
  } else {
    console.log('⚠️  Seed data creation had issues')
    console.log('   Check the output above for specific problems')
  }
  console.log('=' .repeat(60))
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('\n💥 Seed data script failed:', error)
  process.exit(1)
})