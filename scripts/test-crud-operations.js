#!/usr/bin/env node

/**
 * AboutWater GmbH - CRUD Operations Test Script
 * Tests all database operations and creates seed data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🧪 AboutWater GmbH - CRUD Operations Test')
console.log('=' .repeat(60))

async function testCrudOperations() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const testResults = {
    employees: { create: false, read: false, update: false, delete: false },
    vacations: { create: false, read: false, update: false, delete: false },
    holidays: { create: false, read: false, update: false, delete: false },
    settings: { create: false, read: false, update: false, delete: false }
  }
  
  console.log('🧪 Testing CRUD Operations...\n')
  
  // =====================================================
  // EMPLOYEES TABLE TESTS
  // =====================================================
  console.log('👥 Testing EMPLOYEES table:')
  console.log('-' .repeat(30))
  
  let testEmployeeId = null
  
  try {
    // CREATE - Add test employee
    const { data: newEmployee, error: createError } = await supabase
      .from('employees')
      .insert({
        name: 'Max Mustermann (Test)',
        email: 'max.test@aboutwater.de',
        allowance_days: 25.0,
        used_days: 0.0,
        region_code: 'DE'
      })
      .select()
      .single()
    
    if (createError) throw createError
    testEmployeeId = newEmployee.id
    testResults.employees.create = true
    console.log('✅ CREATE: Employee added successfully')
    
  } catch (error) {
    console.log('❌ CREATE: Failed -', error.message)
  }
  
  try {
    // READ - Fetch employees
    const { data: employees, error: readError } = await supabase
      .from('employees')
      .select('*')
      .limit(5)
    
    if (readError) throw readError
    testResults.employees.read = true
    console.log(`✅ READ: Retrieved ${employees.length} employees`)
    
  } catch (error) {
    console.log('❌ READ: Failed -', error.message)
  }
  
  if (testEmployeeId) {
    try {
      // UPDATE - Modify employee
      const { error: updateError } = await supabase
        .from('employees')
        .update({ allowance_days: 30.0 })
        .eq('id', testEmployeeId)
      
      if (updateError) throw updateError
      testResults.employees.update = true
      console.log('✅ UPDATE: Employee modified successfully')
      
    } catch (error) {
      console.log('❌ UPDATE: Failed -', error.message)
    }
  }
  
  // =====================================================
  // HOLIDAYS TABLE TESTS
  // =====================================================
  console.log('\n🎄 Testing HOLIDAYS table:')
  console.log('-' .repeat(30))
  
  let testHolidayId = null
  
  try {
    // CREATE - Add test holiday
    const { data: newHoliday, error: createError } = await supabase
      .from('holidays')
      .insert({
        region_code: 'DE',
        date: '2024-12-31',
        name: 'Silvester (Test)',
        source: 'manual'
      })
      .select()
      .single()
    
    if (createError) throw createError
    testHolidayId = newHoliday.id
    testResults.holidays.create = true
    console.log('✅ CREATE: Holiday added successfully')
    
  } catch (error) {
    console.log('❌ CREATE: Failed -', error.message)
  }
  
  try {
    // READ - Fetch holidays
    const { data: holidays, error: readError } = await supabase
      .from('holidays')
      .select('*')
      .eq('region_code', 'DE')
      .limit(10)
    
    if (readError) throw readError
    testResults.holidays.read = true
    console.log(`✅ READ: Retrieved ${holidays.length} holidays`)
    
  } catch (error) {
    console.log('❌ READ: Failed -', error.message)
  }
  
  if (testHolidayId) {
    try {
      // UPDATE - Modify holiday
      const { error: updateError } = await supabase
        .from('holidays')
        .update({ name: 'New Year\'s Eve (Test)' })
        .eq('id', testHolidayId)
      
      if (updateError) throw updateError
      testResults.holidays.update = true
      console.log('✅ UPDATE: Holiday modified successfully')
      
    } catch (error) {
      console.log('❌ UPDATE: Failed -', error.message)
    }
  }
  
  // =====================================================
  // VACATIONS TABLE TESTS
  // =====================================================
  console.log('\n🏖️  Testing VACATIONS table:')
  console.log('-' .repeat(30))
  
  let testVacationId = null
  
  if (testEmployeeId) {
    try {
      // CREATE - Add test vacation
      const { data: newVacation, error: createError } = await supabase
        .from('vacations')
        .insert({
          employee_id: testEmployeeId,
          start_date: '2024-12-23',
          end_date: '2024-12-27',
          type: 'annual_leave',
          status: 'approved',
          note: 'Christmas holidays (Test)'
        })
        .select()
        .single()
      
      if (createError) throw createError
      testVacationId = newVacation.id
      testResults.vacations.create = true
      console.log('✅ CREATE: Vacation added successfully')
      
    } catch (error) {
      console.log('❌ CREATE: Failed -', error.message)
    }
  }
  
  try {
    // READ - Fetch vacations
    const { data: vacations, error: readError } = await supabase
      .from('vacations')
      .select('*, employees!inner(*)')
      .limit(5)
    
    if (readError) throw readError
    testResults.vacations.read = true
    console.log(`✅ READ: Retrieved ${vacations.length} vacations`)
    
  } catch (error) {
    console.log('❌ READ: Failed -', error.message)
  }
  
  if (testVacationId) {
    try {
      // UPDATE - Modify vacation
      const { error: updateError } = await supabase
        .from('vacations')
        .update({ status: 'pending' })
        .eq('id', testVacationId)
      
      if (updateError) throw updateError
      testResults.vacations.update = true
      console.log('✅ UPDATE: Vacation modified successfully')
      
    } catch (error) {
      console.log('❌ UPDATE: Failed -', error.message)
    }
  }
  
  // =====================================================
  // SETTINGS TABLE TESTS
  // =====================================================
  console.log('\n⚙️  Testing SETTINGS table:')
  console.log('-' .repeat(30))
  
  try {
    // READ - Fetch settings
    const { data: settings, error: readError } = await supabase
      .from('settings')
      .select('*')
      .single()
    
    if (readError) throw readError
    testResults.settings.read = true
    console.log('✅ READ: Settings retrieved successfully')
    console.log(`   Company: ${settings.company_name}`)
    console.log(`   Email: ${settings.notification_email}`)
    
  } catch (error) {
    console.log('❌ READ: Failed -', error.message)
  }
  
  try {
    // UPDATE - Modify settings
    const { error: updateError } = await supabase
      .from('settings')
      .update({ 
        last_holiday_sync_at: new Date().toISOString(),
        default_year: 2024
      })
      .eq('id', 1)
    
    if (updateError) throw updateError
    testResults.settings.update = true
    console.log('✅ UPDATE: Settings modified successfully')
    
  } catch (error) {
    console.log('❌ UPDATE: Failed -', error.message)
  }
  
  // =====================================================
  // CLEANUP TEST DATA
  // =====================================================
  console.log('\n🧹 Cleaning up test data:')
  console.log('-' .repeat(30))
  
  // Delete test vacation
  if (testVacationId) {
    try {
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', testVacationId)
      
      if (error) throw error
      testResults.vacations.delete = true
      console.log('✅ DELETE: Test vacation removed')
    } catch (error) {
      console.log('❌ DELETE: Failed to remove vacation -', error.message)
    }
  }
  
  // Delete test holiday
  if (testHolidayId) {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', testHolidayId)
      
      if (error) throw error
      testResults.holidays.delete = true
      console.log('✅ DELETE: Test holiday removed')
    } catch (error) {
      console.log('❌ DELETE: Failed to remove holiday -', error.message)
    }
  }
  
  // Delete test employee
  if (testEmployeeId) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', testEmployeeId)
      
      if (error) throw error
      testResults.employees.delete = true
      console.log('✅ DELETE: Test employee removed')
    } catch (error) {
      console.log('❌ DELETE: Failed to remove employee -', error.message)
    }
  }
  
  // =====================================================
  // RESULTS SUMMARY
  // =====================================================
  console.log('\n📊 CRUD Test Results:')
  console.log('=' .repeat(60))
  
  let totalTests = 0
  let passedTests = 0
  
  for (const [table, operations] of Object.entries(testResults)) {
    console.log(`\n${table.toUpperCase()}:`)
    for (const [operation, success] of Object.entries(operations)) {
      const status = success ? '✅' : '❌'
      console.log(`  ${status} ${operation.toUpperCase()}`)
      totalTests++
      if (success) passedTests++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log(`📊 Overall Results: ${passedTests}/${totalTests} tests passed`)
  
  const successRate = (passedTests / totalTests) * 100
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: Database is fully operational!')
  } else if (successRate >= 70) {
    console.log('✅ GOOD: Database is mostly functional with minor issues')
  } else if (successRate >= 50) {
    console.log('⚠️  FAIR: Database has significant issues that need attention')
  } else {
    console.log('❌ POOR: Database has critical issues preventing normal operation')
  }
  
  return successRate >= 70
}

// Run the tests
testCrudOperations().then(success => {
  console.log('\n' + '=' .repeat(60))
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('\n💥 Test script failed:', error)
  process.exit(1)
})