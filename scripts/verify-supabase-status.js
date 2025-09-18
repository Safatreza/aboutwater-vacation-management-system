#!/usr/bin/env node

/**
 * Supabase Status Verification
 * Comprehensive check of Supabase instance status
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 AboutWater GmbH - Supabase Status Verification')
console.log('=' .repeat(60))

async function verifySupabaseStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Step 1: Validate Credentials
  console.log('📋 Step 1: Credential Validation')
  console.log('-' .repeat(40))
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    return { status: 'failed', reason: 'missing_credentials' }
  }
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`)
  console.log(`✅ Anon Key: ${supabaseAnonKey.length} characters`)
  console.log(`✅ Key format: ${supabaseAnonKey.startsWith('eyJ') ? 'Valid JWT' : 'Invalid format'}`)
  
  // Step 2: Initialize Client
  console.log('\n🔄 Step 2: Client Initialization')
  console.log('-' .repeat(40))
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.log('✅ Supabase client initialized')
  
  // Step 3: Network Connection Test
  console.log('\n🌐 Step 3: Network Connection Test')
  console.log('-' .repeat(40))
  
  try {
    const response = await fetch(supabaseUrl, {
      method: 'HEAD',
      timeout: 5000
    })
    
    console.log(`✅ Network: ${supabaseUrl} is reachable`)
    console.log(`✅ HTTP Status: ${response.status} ${response.statusText}`)
    
  } catch (error) {
    console.log(`❌ Network: ${error.message}`)
    return { status: 'failed', reason: 'network_unreachable' }
  }
  
  // Step 4: REST API Test
  console.log('\n🔌 Step 4: REST API Authentication Test')
  console.log('-' .repeat(40))
  
  try {
    const apiUrl = `${supabaseUrl}/rest/v1/`
    const response = await fetch(apiUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      console.log(`✅ Authentication: API key accepted`)
      console.log(`✅ REST API: Endpoint accessible`)
    } else {
      const errorText = await response.text()
      console.log(`❌ Authentication: HTTP ${response.status}`)
      console.log(`   Error: ${errorText}`)
      return { status: 'failed', reason: 'auth_failed' }
    }
    
  } catch (error) {
    console.log(`❌ REST API: ${error.message}`)
    return { status: 'failed', reason: 'api_error' }
  }
  
  // Step 5: Database Schema Status
  console.log('\n📊 Step 5: Database Schema Status')
  console.log('-' .repeat(40))
  
  const requiredTables = ['employees', 'vacations', 'holidays', 'settings']
  let tablesExist = 0
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('schema cache')) {
          console.log(`⚠️  Table '${table}': Not created yet`)
        } else {
          console.log(`❌ Table '${table}': Error - ${error.message}`)
        }
      } else {
        console.log(`✅ Table '${table}': Exists and accessible`)
        tablesExist++
      }
    } catch (err) {
      console.log(`❌ Table '${table}': Exception - ${err.message}`)
    }
  }
  
  // Step 6: Final Assessment
  console.log('\n📊 Final Assessment')
  console.log('=' .repeat(60))
  
  const assessmentResults = {
    credentials: '✅ Valid',
    network: '✅ Reachable', 
    authentication: '✅ Working',
    database: tablesExist > 0 ? `✅ ${tablesExist}/4 tables` : '⚠️  Schema not created',
    overallStatus: tablesExist > 0 ? 'READY' : 'NEEDS SCHEMA'
  }
  
  Object.entries(assessmentResults).forEach(([key, value]) => {
    console.log(`${key.toUpperCase().padEnd(15)}: ${value}`)
  })
  
  console.log('\n🎯 STATUS SUMMARY:')
  
  if (tablesExist === requiredTables.length) {
    console.log('🎉 EXCELLENT: Supabase is fully operational!')
    console.log('✅ Database connection working')
    console.log('✅ All tables created and accessible')
    console.log('✅ Ready for production use')
    return { status: 'excellent', tablesExist }
    
  } else if (tablesExist > 0) {
    console.log('⚠️  PARTIAL: Supabase working but incomplete setup')
    console.log('✅ Database connection working')
    console.log(`⚠️  Only ${tablesExist}/${requiredTables.length} tables exist`)
    console.log('🔧 Need to complete schema creation')
    return { status: 'partial', tablesExist }
    
  } else {
    console.log('⚠️  CONNECTED BUT NEEDS SETUP: Supabase accessible but no tables')
    console.log('✅ Database connection working perfectly')
    console.log('✅ Authentication successful')
    console.log('❌ No tables created yet - need to run schema setup')
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Open Supabase dashboard: https://supabase.com/dashboard')
    console.log('2. Navigate to your project: loggvhlcmaipmeeoqifi')
    console.log('3. Go to SQL Editor')
    console.log('4. Run the schema creation SQL provided in the setup guide')
    console.log('5. Run this test again to verify')
    
    return { status: 'connected_needs_setup', tablesExist: 0 }
  }
}

// Run verification
verifySupabaseStatus().then(result => {
  console.log('\n' + '=' .repeat(60))
  
  if (result.status === 'excellent') {
    console.log('🟢 VERDICT: SUPABASE IS FULLY OPERATIONAL')
    process.exit(0)
  } else if (result.status === 'connected_needs_setup') {
    console.log('🟡 VERDICT: SUPABASE CONNECTED - NEEDS SCHEMA SETUP')
    console.log('   This is normal for first-time setup')
    process.exit(0)
  } else {
    console.log('🔴 VERDICT: ISSUES DETECTED')
    console.log(`   Status: ${result.status}`)
    process.exit(1)
  }
}).catch(error => {
  console.error('\n💥 Verification failed:', error.message)
  process.exit(1)
})