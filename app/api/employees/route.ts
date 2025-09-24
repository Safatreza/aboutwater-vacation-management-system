import { NextResponse } from 'next/server'
import { employees } from '@/lib/supabaseStorage'

// GET /api/employees - Get all employees from Supabase
export async function GET() {
  try {
    console.log('📨 API GET /employees - Starting request')

    const employeeList = await employees.getAll()

    console.log(`📖 Loaded ${employeeList.length} employees from Supabase`)
    console.log('👥 Sample employee data:', employeeList.slice(0, 2).map(e => ({
      name: e.name,
      used_vacation_days: e.used_vacation_days,
      remaining_vacation: e.remaining_vacation
    })))

    return NextResponse.json(employeeList)
  } catch (error: any) {
    console.error('❌ Error fetching employees:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/employees - Create new employee
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Creating employee:', { name: body.name, allowance_days: body.allowance || body.allowance_days })

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Employee name is required and cannot be empty' }, { status: 400 })
    }

    const allowanceDays = body.allowance_days || body.allowance || 30
    if (allowanceDays < 1 || allowanceDays > 50) {
      return NextResponse.json({ error: 'Allowance days must be between 1 and 50' }, { status: 400 })
    }

    // Create new employee in Supabase
    const newEmployee = await employees.create({
      name: body.name.trim(),
      allowance_days: allowanceDays,
      used_vacation_days: body.used_vacation_days || 0,
      region_code: body.region_code || 'DE-BY',
      active: body.active !== false,
      color: body.color || '#1c5975'
    })

    console.log(`✅ Successfully created employee: ${newEmployee.name} (ID: ${newEmployee.id})`)

    return NextResponse.json({
      success: true,
      employee: newEmployee
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Error creating employee:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/employees - Update employee
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // Check if this is a bulk update (array) or single employee update
    if (Array.isArray(body)) {
      console.log('⚠️ Bulk employee updates not supported in Supabase mode. Use individual updates.')
      return NextResponse.json({
        error: 'Bulk updates not supported. Use individual employee updates.'
      }, { status: 400 })
    }

    // Single employee update
    if (!body.id) {
      return NextResponse.json({ error: 'Employee ID is required for updates' }, { status: 400 })
    }

    console.log('Updating employee:', body.id)

    const updatedEmployee = await employees.update(body.id, {
      name: body.name,
      allowance_days: body.allowance_days || body.allowance,
      used_vacation_days: body.used_vacation_days || body.used,
      region_code: body.region_code,
      active: body.active,
      color: body.color
    })

    console.log(`✅ Successfully updated employee: ${updatedEmployee.name}`)

    return NextResponse.json({
      success: true,
      employee: updatedEmployee
    })

  } catch (error: any) {
    console.error('❌ Error updating employee:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/employees - Delete (deactivate) employee
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('id')

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    console.log('Deactivating employee:', employeeId)

    await employees.delete(employeeId)

    console.log(`✅ Successfully deactivated employee: ${employeeId}`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ Error deleting employee:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}