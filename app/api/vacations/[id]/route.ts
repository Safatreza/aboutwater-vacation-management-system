import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File paths for shared storage
const dataDir = path.join(process.cwd(), 'data')
const vacationsFile = path.join(dataDir, 'vacations.json')
const employeesFile = path.join(dataDir, 'employees.json')

// GET /api/vacations/[id] - Get single vacation by ID using shared storage
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const vacationId = params.id

  try {
    console.log(`📨 API GET /vacations/${vacationId} - Using SHARED FILE STORAGE`)

    // Check if vacations file exists
    if (!fs.existsSync(vacationsFile)) {
      return NextResponse.json({ error: 'Vacation data not found' }, { status: 404 })
    }

    // Read vacations from shared file
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    const vacation = vacations.find((vac: any) => vac.id === vacationId)

    if (!vacation) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    console.log(`📖 Found vacation: ${vacation.days} days`)
    return NextResponse.json(vacation)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching vacation'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/vacations/[id] - Delete single vacation using shared storage
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const vacationId = params.id

  try {
    console.log(`📨 API DELETE /vacations/${vacationId} - Using SHARED FILE STORAGE`)

    // Check if files exist
    if (!fs.existsSync(vacationsFile) || !fs.existsSync(employeesFile)) {
      return NextResponse.json({ error: 'Data files not found' }, { status: 404 })
    }

    // Read current data
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))

    // Find vacation to delete
    const vacationIndex = vacations.findIndex((vac: any) => vac.id === vacationId)

    if (vacationIndex === -1) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    const deletedVacation = vacations[vacationIndex]
    vacations.splice(vacationIndex, 1)

    // Update employee used/remaining days
    const employeeIndex = employees.findIndex((emp: any) => emp.id === deletedVacation.employee_id)

    if (employeeIndex !== -1) {
      const oldUsed = employees[employeeIndex].used
      employees[employeeIndex].used = parseFloat(employees[employeeIndex].used) - parseFloat(deletedVacation.days)
      employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used

      // Save updated employees
      fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))
      console.log(`📊 Reverted employee ${employees[employeeIndex].name}: used ${oldUsed} → ${employees[employeeIndex].used}`)
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