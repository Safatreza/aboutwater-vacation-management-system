const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = "https://loggvhlcmaipmeeoqifi.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZ2d2aGxjbWFpcG1lZW9xaWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTA4MTYsImV4cCI6MjA3MzM2NjgxNn0.yV4LuhnP1ABb7i597NI4q7DXFnIXC67blPQ3KjGzIHQ"

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixEmployeeVacationDays() {
  console.log("🔧 FIXING EMPLOYEE VACATION DAYS...")

  try {
    const currentYear = new Date().getFullYear()

    // Get all employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*")

    if (empError) throw empError

    for (const employee of employees) {
      // Calculate total vacation days used this year
      const { data: vacations, error: vacError } = await supabase
        .from("vacations")
        .select("working_days")
        .eq("employee_id", employee.id)
        .gte("start_date", `${currentYear}-01-01`)
        .lte("end_date", `${currentYear}-12-31`)

      if (vacError) throw vacError

      const totalUsedDays = vacations.reduce((sum, vac) => sum + (vac.working_days || 0), 0)

      // Update employee with calculated used days
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          used_vacation_days: totalUsedDays
        })
        .eq("id", employee.id)

      if (updateError) throw updateError

      console.log(`✅ Updated ${employee.name}: ${totalUsedDays} days used`)
    }

    console.log("🎉 All employee vacation days updated successfully\!")

  } catch (error) {
    console.error("❌ Failed to fix vacation days:", error)
  }
}

fixEmployeeVacationDays()
