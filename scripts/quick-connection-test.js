#!/usr/bin/env node

/**
 * Quick Supabase Connection Test
 * Tests if we can connect to the Supabase instance
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Quick Supabase Connection Test')
console.log('=' .repeat(50))

async function testConnection() {
  // Validate credentials
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials')
    return false
  }
  
  console.log(`📍 URL: ${supabaseUrl}`)
  console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...`)
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Test 1: Try to access a system table
  console.log('\n🧪 Test 1: Basic Connection')
  try {
    const startTime = Date.now()
    
    // Try a simple query that should work even without our tables
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('table_name')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      console.log(`❌ Failed: ${error.message}`)
      console.log(`   Code: ${error.code}`)
      console.log(`   Hint: ${error.hint || 'None'}`)
    } else {
      console.log(`✅ Success (${responseTime}ms)`)
      console.log(`   Response: Connection to Supabase working`)
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`)
  }
  
  // Test 2: Try to check if our tables exist
  console.log('\n🧪 Test 2: Check Our Tables')
  const tables = ['employees', 'vacations', 'holidays', 'settings']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`⚠️  Table '${table}': Does not exist (need to create schema)`)
        } else {
          console.log(`❌ Table '${table}': ${error.message}`)
        }
      } else {
        console.log(`✅ Table '${table}': Exists and accessible`)
      }
    } catch (err) {
      console.log(`❌ Table '${table}': Exception - ${err.message}`)
    }
  }
  
  // Test 3: Simple REST API test
  console.log('\n🧪 Test 3: REST API Access')
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    
    if (response.ok) {
      console.log(`✅ REST API: Accessible (HTTP ${response.status})`)
    } else {
      console.log(`❌ REST API: HTTP ${response.status} - ${response.statusText}`)
    }
  } catch (err) {
    console.log(`❌ REST API: ${err.message}`)
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Connection Test Summary:')
  console.log('- Credentials: Configured ✅')
  console.log('- Basic Connection: Testing above ⬆️')
  console.log('- Tables: Need to be created (expected) ⚠️')
  console.log('- REST API: Testing above ⬆️')
  
  return true
}

testConnection().then(() => {
  console.log('\n🏁 Test completed')
}).catch(error => {
  console.error('\n💥 Test failed:', error.message)
})