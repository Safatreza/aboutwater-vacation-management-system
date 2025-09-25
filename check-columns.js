const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = "https://loggvhlcmaipmeeoqifi.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ2d2aGxjbWFpcG1lZW9xaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTA4MTYsImV4cCI6MjA3MzM2NjgxNn0.yV4LuhnP1ABb7i597NI4q7DXFnIXC67blPQ3KjGzIHQ"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmployeeColumns() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .limit(1)

  if (error) {
    console.error("Error:", error)
  } else if (data && data.length > 0) {
    console.log("Employee table columns:")
    console.log(Object.keys(data[0]))
    console.log("Sample employee data:")
    console.log(JSON.stringify(data[0], null, 2))
  }
}

checkEmployeeColumns()
