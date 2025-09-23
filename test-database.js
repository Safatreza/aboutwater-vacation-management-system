// TEST REAL DATABASE CONNECTION
// Run this to verify Supabase is working

import { config } from 'dotenv';
import { testConnection, getEmployees, addVacationToDb } from './lib/database.js';

// Load environment variables
config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🧪 Testing REAL Supabase Database Connection...');

  try {
    // Test 1: Connection
    console.log('\n1️⃣ Testing connection...');
    const connected = await testConnection();

    if (!connected) {
      console.error('❌ Database connection failed!');
      console.error('Check your .env.local file has correct Supabase credentials');
      return;
    }

    console.log('✅ Database connection successful!');

    // Test 2: Load employees
    console.log('\n2️⃣ Testing employee loading...');
    const employees = await getEmployees();
    console.log(`✅ Loaded ${employees.length} employees from database`);

    if (employees.length > 0) {
      console.log('First employee:', employees[0]);
    }

    // Test 3: Add test vacation for Safat Majumder
    console.log('\n3️⃣ Testing vacation addition...');
    const safat = employees.find(emp => emp.name === 'Safat Majumder');

    if (safat) {
      const testVacation = {
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        days: 2,
        reason: 'TEST VACATION - Multi-user database test'
      };

      console.log('Adding test vacation for Safat Majumder...');
      await addVacationToDb(safat.id, testVacation);
      console.log('✅ Test vacation added successfully!');

      console.log('\n🎯 MULTI-USER TEST INSTRUCTIONS:');
      console.log('1. Open the app in Browser 1');
      console.log('2. Open the app in Browser 2 (different browser or incognito)');
      console.log('3. Both should show the test vacation for Safat Majumder');
      console.log('4. Add another vacation in Browser 1');
      console.log('5. Refresh Browser 2 - should see the new vacation');
      console.log('\nIf this works, the multi-user database is REAL and WORKING! 🚀');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testDatabaseConnection();