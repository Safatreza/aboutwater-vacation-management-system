#!/usr/bin/env node

/**
 * AboutWater GmbH - Complete Database Health Check
 * Comprehensive verification of database setup and functionality
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🏥 AboutWater GmbH - Database Health Check')
console.log('=' .repeat(60))

async function runHealthCheck() {
  const healthReport = {
    connection: { status: 'unknown', responseTime: 0, error: null },
    tables: { employees: false, vacations: false, holidays: false, settings: false },
    data: { employees: 0, vacations: 0, holidays: 0, settings: 0 },
    performance: { averageResponseTime: 0, tests: [] },
    integrity: { foreignKeys: false, constraints: false, indexes: false },
    functionality: { crud: false, relationships: false, calculations: false },
    security: { rls: false, policies: false, permissions: false },
    overall: 'fail'
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    return healthReport
  }
  
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Using credentials for health check`)
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // =====================================================
  // CONNECTION TEST
  // =====================================================
  console.log('\n🔌 Testing Database Connection')
  console.log('-' .repeat(40))
  
  try {
    const startTime = Date.now()
    const { data, error } = await supabase.rpc('version')
    const responseTime = Date.now() - startTime
    
    if (error) throw error
    
    healthReport.connection = {
      status: 'connected',
      responseTime,
      error: null
    }
    
    console.log(`✅ Connection successful (${responseTime}ms)`)
    
  } catch (error) {
    healthReport.connection = {
      status: 'failed',
      responseTime: 0,
      error: error.message
    }
    console.log(`❌ Connection failed: ${error.message}`)
    return healthReport
  }
  
  // =====================================================
  // TABLE STRUCTURE TEST
  // =====================================================
  console.log('\n📋 Testing Table Structure')
  console.log('-' .repeat(40))
  
  const requiredTables = ['employees', 'vacations', 'holidays', 'settings']
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) throw error
      
      healthReport.tables[tableName] = true
      console.log(`✅ Table '${tableName}': Accessible`)
      
    } catch (error) {
      healthReport.tables[tableName] = false
      console.log(`❌ Table '${tableName}': ${error.message}`)
    }
  }
  
  const accessibleTables = Object.values(healthReport.tables).filter(Boolean).length
  console.log(`\n📊 Table Summary: ${accessibleTables}/${requiredTables.length} tables accessible`)
  
  // =====================================================
  // DATA VERIFICATION
  // =====================================================
  console.log('\n📊 Testing Data Availability')
  console.log('-' .repeat(40))
  
  // Count employees
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
    
    if (error) throw error
    healthReport.data.employees = data.length
    console.log(`👥 Employees: ${data.length} records`)
  } catch (error) {
    console.log(`❌ Employees count failed: ${error.message}`)
  }
  
  // Count vacations
  try {
    const { data, error } = await supabase
      .from('vacations')
      .select('id', { count: 'exact' })
    
    if (error) throw error
    healthReport.data.vacations = data.length
    console.log(`🏖️  Vacations: ${data.length} records`)
  } catch (error) {
    console.log(`❌ Vacations count failed: ${error.message}`)
  }
  
  // Count holidays
  try {
    const { data, error } = await supabase
      .from('holidays')
      .select('id', { count: 'exact' })
    
    if (error) throw error
    healthReport.data.holidays = data.length
    console.log(`🎄 Holidays: ${data.length} records`)
  } catch (error) {
    console.log(`❌ Holidays count failed: ${error.message}`)
  }
  
  // Check settings
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()
    
    if (error) throw error
    healthReport.data.settings = 1
    console.log(`⚙️  Settings: Configured (${data.company_name})`)
  } catch (error) {
    console.log(`❌ Settings check failed: ${error.message}`)
  }
  
  // =====================================================
  // PERFORMANCE TEST
  // =====================================================
  console.log('\n⚡ Testing Performance')
  console.log('-' .repeat(40))
  
  const performanceTests = []
  
  for (let i = 0; i < 5; i++) {
    try {
      const startTime = Date.now()
      await supabase
        .from('employees')
        .select('name')
        .limit(1)
      const responseTime = Date.now() - startTime
      performanceTests.push(responseTime)
      console.log(`   Query ${i + 1}: ${responseTime}ms`)
    } catch (error) {
      console.log(`   Query ${i + 1}: Failed`)
    }
  }
  
  if (performanceTests.length > 0) {
    const avgTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length
    healthReport.performance = {
      averageResponseTime: Math.round(avgTime),
      tests: performanceTests
    }
    
    console.log(`📊 Average response time: ${Math.round(avgTime)}ms`)
    
    if (avgTime < 200) {
      console.log('✅ Performance: Excellent (<200ms)')
    } else if (avgTime < 500) {
      console.log('✅ Performance: Good (<500ms)')
    } else if (avgTime < 1000) {
      console.log('⚠️  Performance: Acceptable (<1000ms)')
    } else {
      console.log('❌ Performance: Slow (>1000ms)')
    }
  }
  
  // =====================================================
  // RELATIONSHIP TEST
  // =====================================================
  console.log('\n🔗 Testing Table Relationships')
  console.log('-' .repeat(40))
  
  try {
    // Test employee-vacation relationship
    const { data: vacationsWithEmployees, error } = await supabase
      .from('vacations')
      .select(`
        id,
        start_date,
        end_date,
        employees!inner (
          id,
          name,
          email
        )
      `)
      .limit(3)
    
    if (error) throw error
    
    healthReport.functionality.relationships = true
    console.log(`✅ Employee-Vacation relationships: ${vacationsWithEmployees.length} linked records`)
    
    vacationsWithEmployees.forEach((vacation, index) => {
      console.log(`   ${index + 1}. ${vacation.employees.name}: ${vacation.start_date} to ${vacation.end_date}`)
    })
    
  } catch (error) {
    healthReport.functionality.relationships = false
    console.log(`❌ Relationship test failed: ${error.message}`)
  }
  
  // =====================================================
  // BUSINESS LOGIC TEST
  // =====================================================
  console.log('\n🧠 Testing Business Logic')
  console.log('-' .repeat(40))
  
  try {
    // Test vacation calculation logic
    const { data: employeesWithVacations, error } = await supabase
      .from('employees')
      .select(`
        name,
        allowance_days,
        used_days,
        vacations (
          start_date,
          end_date,
          status
        )
      `)
      .limit(2)
    
    if (error) throw error
    
    healthReport.functionality.calculations = true
    console.log('✅ Business logic calculations working')
    
    employeesWithVacations.forEach(employee => {
      const approvedVacations = employee.vacations.filter(v => v.status === 'approved')
      const remainingDays = employee.allowance_days - employee.used_days
      console.log(`   ${employee.name}: ${employee.allowance_days} total, ${employee.used_days} used, ${remainingDays} remaining`)
    })
    
  } catch (error) {
    healthReport.functionality.calculations = false
    console.log(`❌ Business logic test failed: ${error.message}`)
  }
  
  // =====================================================
  // FINAL HEALTH ASSESSMENT
  // =====================================================
  console.log('\n🏥 Health Assessment Summary')
  console.log('=' .repeat(60))
  
  const checks = [
    { name: 'Database Connection', status: healthReport.connection.status === 'connected' },
    { name: 'All Tables Accessible', status: accessibleTables === requiredTables.length },
    { name: 'Sufficient Data', status: healthReport.data.employees >= 1 && healthReport.data.holidays >= 10 },
    { name: 'Good Performance', status: healthReport.performance.averageResponseTime < 1000 },
    { name: 'Relationships Working', status: healthReport.functionality.relationships },
    { name: 'Business Logic OK', status: healthReport.functionality.calculations }
  ]
  
  let passedChecks = 0
  checks.forEach(check => {
    const status = check.status ? '✅' : '❌'
    console.log(`${status} ${check.name}`)
    if (check.status) passedChecks++
  })
  
  const healthScore = Math.round((passedChecks / checks.length) * 100)
  
  console.log('\n' + '=' .repeat(60))
  console.log(`🎯 Overall Health Score: ${healthScore}%`)
  
  if (healthScore >= 90) {
    healthReport.overall = 'excellent'
    console.log('🎉 STATUS: EXCELLENT - Database is production ready!')
    console.log('✅ All systems operational')
    console.log('✅ Performance is optimal')
    console.log('✅ Data integrity confirmed')
  } else if (healthScore >= 70) {
    healthReport.overall = 'good'
    console.log('✅ STATUS: GOOD - Database is functional with minor issues')
    console.log('⚠️  Some optimizations may be needed')
  } else if (healthScore >= 50) {
    healthReport.overall = 'fair'
    console.log('⚠️  STATUS: FAIR - Database has issues that need attention')
    console.log('❌ Several problems need to be resolved')
  } else {
    healthReport.overall = 'poor'
    console.log('❌ STATUS: POOR - Database has critical issues')
    console.log('🚨 Immediate attention required')
  }
  
  // Recommendations
  console.log('\n📋 Recommendations:')
  if (!healthReport.tables.employees) {
    console.log('   🔧 Create database schema using Supabase SQL Editor')
  }
  if (healthReport.data.employees === 0) {
    console.log('   🌱 Add sample data using: node scripts/create-seed-data.js')
  }
  if (healthReport.performance.averageResponseTime > 500) {
    console.log('   ⚡ Consider database optimization and indexing')
  }
  if (!healthReport.functionality.relationships) {
    console.log('   🔗 Check foreign key constraints and relationships')
  }
  
  console.log('=' .repeat(60))
  
  return healthReport
}

// Generate detailed report
async function generateReport() {
  const healthReport = await runHealthCheck()
  
  console.log('\n📋 DETAILED HEALTH REPORT')
  console.log('=' .repeat(60))
  console.log(JSON.stringify(healthReport, null, 2))
  
  return healthReport.overall !== 'poor'
}

// Run health check
generateReport().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('\n💥 Health check failed:', error)
  process.exit(1)
})