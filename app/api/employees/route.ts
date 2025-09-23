import { NextResponse } from 'next/server'
import { getEmployees, addEmployee } from '@/lib/sharedData'

// GET /api/employees - Get all employees using shared data
export async function GET() {
  try {
    const employees = getEmployees()
    console.log('📨 API GET /employees - Starting request')
    console.log(`📖 Loaded ${employees.length} employees from shared storage`)
    console.log('👥 Sample employee data:', employees.slice(0, 2).map(e => ({
      name: e.name,
      used: e.used,
      remaining: e.remaining
    })))
    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/employees - Create new employee
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Creating employee:', { name: body.name, allowance: body.allowance })

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Employee name is required and cannot be empty' }, { status: 400 })
    }

    if (!body.allowance || body.allowance < 1 || body.allowance > 50) {
      return NextResponse.json({ error: 'Allowance days must be between 1 and 50' }, { status: 400 })
    }

    // Create new employee
    const newEmployee = {
      id: `emp_${Date.now()}`,
      name: body.name.trim(),
      allowance: body.allowance,
      used: 0,
      remaining: body.allowance,
      color: body.color || '#1c5975'
    }

    // Add to shared employees array
    addEmployee(newEmployee)

    console.log(`Successfully created employee with ID: ${newEmployee.id}`)

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 })

  } catch (error: any) {
    console.error('Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/employees - Update employees
export async function PUT(request: Request) {
  try {
    const newEmployees = await request.json()

    console.log('Updating employees:', newEmployees.length)

    // Replace shared employees with updated ones
    const currentEmployees = getEmployees()
    currentEmployees.length = 0
    currentEmployees.push(...newEmployees)

    console.log(`Successfully saved ${newEmployees.length} employees`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}