// Database content verification test
const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = "https://loggvhlcmaipmeeoqifi.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ2d2aGxjbWFpcG1lZW9xaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTA4MTYsImV4cCI6MjA3MzM2NjgxNn0.yV4LuhnP1ABb7i597NI4q7DXFnIXC67blPQ3KjGzIHQ"

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log("🔍 TESTING DATABASE CONTENT...")

  try {
    // Test employees table
    console.log("📊 EMPLOYEES TABLE:")
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")
      .limit(5)

    if (empError) {
      console.error("❌ Employees error:", empError)
    } else {
      console.log(`✅ Found ${employees.length} employees:`)
      employees.forEach((emp, i) => {
        console.log(`  ${i+1}. ${emp.name} - Allowance: ${emp.allowance_days}, Used: ${emp.used_vacation_days}, Active: ${emp.active}`)
      })
    }

    // Test vacations table
    console.log("📅 VACATIONS TABLE:")
    const { data: vacations, error: vacError } = await supabase
      .from("vacations")
      .select("*, employee:employees(name)")
      .limit(5)

    if (vacError) {
      console.error("❌ Vacations error:", vacError)
    } else {
      console.log(`✅ Found ${vacations.length} vacation entries:`)
      vacations.forEach((vac, i) => {
        console.log(`  ${i+1}. ${vac.employee?.name || "Unknown"} - ${vac.start_date} to ${vac.end_date} (${vac.working_days} days)`)
      })
    }

  } catch (error) {
    console.error("❌ Database test failed:", error)
  }
}

testDatabase()
