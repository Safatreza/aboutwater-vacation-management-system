#!/usr/bin/env node

/**
 * AboutWater GmbH - Database Connection Test Script
 * This script tests the Supabase database connection and verifies all functionality
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🚀 AboutWater GmbH - Database Connection Test')
console.log('=' .repeat(60))

async function runTests() {
  // Step 1: Validate environment variables
  console.log('\n📋 Step 1: Environment Variables Validation')
  console.log('-' .repeat(40))
  
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    process.exit(1)
  }
  
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    process.exit(1)
  }
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`)
  console.log(`✅ Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
  
  // Step 2: Initialize Supabase client
  console.log('\n🔄 Step 2: Initialize Supabase Client')
  console.log('-' .repeat(40))
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('✅ Supabase client initialized')
  
  // Step 3: Test basic connection
  console.log('\n🧪 Step 3: Test Database Connection')
  console.log('-' .repeat(40))
  
  try {
    const startTime = Date.now()
    
    // Simple connection test using a basic RPC call
    const { data, error } = await supabase.rpc('version')
    
    const connectionTime = Date.now() - startTime
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      console.error('   Details:', error)
      return false
    }
    
    console.log(`✅ Connection successful (${connectionTime}ms)`)
    console.log(`📊 Database version: PostgreSQL connection active`)
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
  
  // Step 4: Check required tables
  console.log('\n📋 Step 4: Check Required Tables')
  console.log('-' .repeat(40))
  
  const requiredTables = ['employees', 'vacations', 'holidays', 'settings']
  const tableStatus = {}
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`)
        tableStatus[tableName] = false
      } else {
        console.log(`✅ Table '${tableName}': Accessible`)
        tableStatus[tableName] = true
      }
    } catch (error) {
      console.log(`❌ Table '${tableName}': ${error.message}`)
      tableStatus[tableName] = false
    }
  }
  
  const accessibleTables = Object.values(tableStatus).filter(Boolean).length
  console.log(`\n📊 Summary: ${accessibleTables}/${requiredTables.length} tables accessible`)
  
  // Step 5: Performance test
  console.log('\n⚡ Step 5: Performance Test')
  console.log('-' .repeat(40))
  
  const performanceTests = []
  
  for (let i = 0; i < 3; i++) {
    const startTime = Date.now()
    try {
      await supabase
        .from('information_schema.tables')
        .select('count')
        .eq('table_schema', 'public')
        .single()
      
      const responseTime = Date.now() - startTime
      performanceTests.push(responseTime)
      console.log(`   Test ${i + 1}: ${responseTime}ms`)
    } catch (error) {
      console.log(`   Test ${i + 1}: Failed - ${error.message}`)
    }
  }
  
  if (performanceTests.length > 0) {
    const avgTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length
    console.log(`📊 Average response time: ${Math.round(avgTime)}ms`)
    
    if (avgTime < 500) {
      console.log('✅ Performance: Excellent (<500ms)')
    } else if (avgTime < 1000) {
      console.log('⚠️  Performance: Good (500-1000ms)')
    } else {
      console.log('❌ Performance: Slow (>1000ms)')
    }
  }
  
  // Step 6: Final report
  console.log('\n📋 Final Report')
  console.log('=' .repeat(60))
  
  const allTablesAccessible = Object.values(tableStatus).every(Boolean)
  const hasGoodPerformance = performanceTests.length > 0 && 
    performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length < 1000
  
  if (allTablesAccessible && hasGoodPerformance) {
    console.log('🎉 STATUS: READY FOR PRODUCTION')
    console.log('✅ All systems operational')
    console.log('✅ Database connection stable')
    console.log('✅ All required tables accessible')
    console.log('✅ Performance within acceptable limits')
    return true
  } else {
    console.log('⚠️  STATUS: SETUP REQUIRED')
    if (!allTablesAccessible) {
      const missingTables = Object.entries(tableStatus)
        .filter(([_, accessible]) => !accessible)
        .map(([table]) => table)
      console.log(`❌ Missing tables: ${missingTables.join(', ')}`)
    }
    if (!hasGoodPerformance) {
      console.log('❌ Performance issues detected')
    }
    return false
  }
}

// Run the tests
runTests().then(success => {
  console.log('\n' + '=' .repeat(60))
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('\n💥 Test script failed:', error)
  process.exit(1)
})