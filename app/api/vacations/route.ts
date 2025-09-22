import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File paths for shared storage
const dataDir = path.join(process.cwd(), 'data')
const vacationsFile = path.join(dataDir, 'vacations.json')
const employeesFile = path.join(dataDir, 'employees.json')

// GET /api/vacations - Get all vacations using shared file storage
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('📨 API GET /vacations - Using SHARED FILE STORAGE')

    // Initialize files if needed
    if (!fs.existsSync(vacationsFile)) {
      fs.writeFileSync(vacationsFile, JSON.stringify([], null, 2))
    }

    // Read vacations from shared file
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    console.log(`📖 Loaded ${vacations.length} vacations from SHARED STORAGE`)

    return NextResponse.json(vacations)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching vacations'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/vacations - Create new vacation
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    console.log('Adding vacation to shared storage:', body)

    // Validate required fields
    if (!body.employee_id || !body.start_date || !body.end_date || !body.days) {
      return NextResponse.json({ error: 'Employee ID, start date, end date, and days are required' }, { status: 400 })
    }

    // Initialize files if needed
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    if (!fs.existsSync(vacationsFile)) {
      fs.writeFileSync(vacationsFile, JSON.stringify([], null, 2))
    }
    if (!fs.existsSync(employeesFile)) {
      return NextResponse.json({ error: 'Employees file not found' }, { status: 500 })
    }

    // Read current data
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))

    // Create new vacation
    const newVacation = {
      id: `vac_${Date.now()}`,
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      days: parseFloat(body.days),
      reason: body.reason || 'Urlaub',
      created_at: new Date().toISOString()
    }

    // Add to vacations array
    vacations.push(newVacation)

    // Update employee used/remaining days
    const employeeIndex = employees.findIndex(emp => emp.id === newVacation.employee_id)

    if (employeeIndex !== -1) {
      const oldUsed = employees[employeeIndex].used
      employees[employeeIndex].used = parseFloat(employees[employeeIndex].used.toString()) + parseFloat(newVacation.days.toString())
      employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used

      // Save updated employees
      fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))
      console.log(`📊 Updated employee ${employees[employeeIndex].name}: used ${oldUsed} → ${employees[employeeIndex].used}, remaining: ${employees[employeeIndex].remaining}`)
    }

    // Save updated vacations
    fs.writeFileSync(vacationsFile, JSON.stringify(vacations, null, 2))

    console.log(`➕ Added vacation: ${newVacation.days} days for employee ${newVacation.employee_id}`)

    return NextResponse.json({
      success: true,
      vacation: newVacation,
      employees: employees
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating vacation'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/vacations - Delete vacation
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { id } = body

    console.log(`🗑️ Deleting vacation from shared storage: ${id}`)

    // Read current data
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))

    // Find vacation to delete
    const vacationIndex = vacations.findIndex(vac => vac.id === id)

    if (vacationIndex === -1) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    const deletedVacation = vacations[vacationIndex]
    vacations.splice(vacationIndex, 1)

    // Update employee used/remaining days
    const employeeIndex = employees.findIndex(emp => emp.id === deletedVacation.employee_id)

    if (employeeIndex !== -1) {
      const oldUsed = employees[employeeIndex].used
      employees[employeeIndex].used = parseFloat(employees[employeeIndex].used.toString()) - parseFloat(deletedVacation.days.toString())
      employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used

      // Save updated employees
      fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))
      console.log(`📊 Reverted employee ${employees[employeeIndex].name}: used ${oldUsed} → ${employees[employeeIndex].used}, remaining: ${employees[employeeIndex].remaining}`)
    }

    // Save updated vacations
    fs.writeFileSync(vacationsFile, JSON.stringify(vacations, null, 2))

    console.log(`🗑️ Deleted vacation: ${deletedVacation.id}`)

    return NextResponse.json({
      success: true,
      deletedVacation,
      employees: employees
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error deleting vacation'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}