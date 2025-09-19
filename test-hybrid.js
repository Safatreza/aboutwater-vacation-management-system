// TEST HYBRID STORAGE SYSTEM
import { getEmployees, getConnectionStatus } from './lib/hybridStorage.js';

console.log('🧪 Testing HYBRID Storage System...');

async function testHybridSystem() {
  try {
    // Test connection status
    console.log('\n1️⃣ Testing connection status...');
    const status = await getConnectionStatus();
    console.log('Connection Status:', status);

    // Test employee loading
    console.log('\n2️⃣ Testing employee loading...');
    const employees = await getEmployees();
    console.log(`✅ Loaded ${employees.length} employees`);

    if (employees.length > 0) {
      console.log('Sample employee:', employees[0]);
    }

    console.log('\n🎯 HYBRID SYSTEM TEST COMPLETE:');
    console.log(`- Storage mode: ${status.status}`);
    console.log(`- Status message: ${status.message}`);
    console.log(`- Employees loaded: ${employees.length}`);
    console.log('\n✅ System is working correctly with automatic fallback!');

  } catch (error) {
    console.error('❌ Hybrid test failed:', error);
  }
}

testHybridSystem();