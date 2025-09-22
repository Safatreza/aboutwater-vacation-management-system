import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File paths for shared storage
const dataDir = path.join(process.cwd(), 'data')
const employeesFile = path.join(dataDir, 'employees.json')

// GET /api/employees/[id] - Get single employee by ID using shared storage
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const employeeId = params.id

  try {
    console.log(`📨 API GET /employees/${employeeId} - Using SHARED FILE STORAGE`)

    // Check if employees file exists
    if (!fs.existsSync(employeesFile)) {
      return NextResponse.json({ error: 'Employee data not found' }, { status: 404 })
    }

    // Read employees from shared file
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))
    const employee = employees.find((emp: any) => emp.id === employeeId)

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    console.log(`📖 Found employee: ${employee.name}`)
    return NextResponse.json(employee)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching employee'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PATCH /api/employees/[id] - Update single employee using shared storage
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const employeeId = params.id

  try {
    const body = await req.json()
    console.log(`📨 API PATCH /employees/${employeeId} - Using SHARED FILE STORAGE`)

    // Check if employees file exists
    if (!fs.existsSync(employeesFile)) {
      return NextResponse.json({ error: 'Employee data not found' }, { status: 404 })
    }

    // Read employees from shared file
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))
    const employeeIndex = employees.findIndex((emp: any) => emp.id === employeeId)

    if (employeeIndex === -1) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Update employee data
    employees[employeeIndex] = { ...employees[employeeIndex], ...body }

    // Recalculate remaining vacation if allowance changed
    if (body.allowance !== undefined) {
      employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used
    }

    // Save back to file
    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))

    console.log(`💾 Updated employee: ${employees[employeeIndex].name}`)
    return NextResponse.json({ success: true, employee: employees[employeeIndex] })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error updating employee'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/employees/[id] - Delete single employee using shared storage
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const employeeId = params.id

  try {
    console.log(`📨 API DELETE /employees/${employeeId} - Using SHARED FILE STORAGE`)

    // Check if employees file exists
    if (!fs.existsSync(employeesFile)) {
      return NextResponse.json({ error: 'Employee data not found' }, { status: 404 })
    }

    // Read employees from shared file
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))
    const employeeIndex = employees.findIndex((emp: any) => emp.id === employeeId)

    if (employeeIndex === -1) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Remove employee
    const deletedEmployee = employees.splice(employeeIndex, 1)[0]

    // Save back to file
    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))

    console.log(`🗑️ Deleted employee: ${deletedEmployee.name}`)
    return NextResponse.json({ success: true, deletedEmployee })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error deleting employee'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}