import { NextResponse } from 'next/server'
import { getVacations, getEmployees, addVacation, removeVacation } from '@/lib/sharedData'

// GET /api/vacations - Get all vacations
export async function GET() {
  try {
    const vacations = getVacations()
    console.log('📨 GET /api/vacations - returning vacations:', vacations.length)
    return NextResponse.json(vacations)
  } catch (error: any) {
    console.error('❌ GET /api/vacations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/vacations - Create new vacation
export async function POST(request: Request) {
  console.log('🔥 VACATION POST REQUEST RECEIVED')

  try {
    console.log('📍 POST /api/vacations - starting')

    const body = await request.json()
    console.log('📝 Request body:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.employee_id) {
      return NextResponse.json({ error: 'employee_id is required' }, { status: 400 })
    }

    if (!body.start_date) {
      return NextResponse.json({ error: 'start_date is required' }, { status: 400 })
    }

    if (!body.end_date) {
      return NextResponse.json({ error: 'end_date is required' }, { status: 400 })
    }

    // Create vacation entry
    const newVacation = {
      id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      days: parseFloat(body.days?.toString() || '1'),
      reason: body.reason || 'Urlaub (ganzer Tag)',
      created_at: new Date().toISOString()
    }

    console.log('✅ Vacation created:', JSON.stringify(newVacation, null, 2))

    // Add to shared storage
    addVacation(newVacation)
    const vacations = getVacations()
    console.log('📊 Total vacations in storage:', vacations.length)

    // Update employee used days
    const employees = getEmployees()
    const employee = employees.find(emp => emp.id === body.employee_id)
    console.log('🔍 Found employee:', employee ? employee.name : 'NOT FOUND')

    if (employee) {
      const currentUsed = parseFloat(employee.used.toString())
      const vacationDays = parseFloat(newVacation.days.toString())
      const oldUsed = employee.used
      const oldRemaining = employee.remaining

      employee.used = currentUsed + vacationDays
      employee.remaining = employee.allowance - employee.used

      console.log('📊 Updated employee:', {
        name: employee.name,
        oldUsed,
        newUsed: employee.used,
        oldRemaining,
        newRemaining: employee.remaining,
        vacationDays
      })
    }

    console.log('✅ POST /api/vacations - success')
    return NextResponse.json({
      success: true,
      vacation: newVacation,
      employees: employees
    })

  } catch (error: any) {
    console.error('❌ VACATION POST ERROR:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    })
    return NextResponse.json({
      error: 'Failed to add vacation',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE /api/vacations - Delete vacation
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    console.log(`🗑️ Deleting vacation: ${id}`)

    // Find vacation to delete from shared storage
    const vacations = getVacations()
    const deletedVacation = vacations.find(vac => vac.id === id)

    if (!deletedVacation) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    // Remove from shared storage
    removeVacation(id)

    // Update employee used/remaining days
    const employees = getEmployees()
    const employee = employees.find(emp => emp.id === deletedVacation.employee_id)

    if (employee) {
      const oldUsed = employee.used
      employee.used = parseFloat(employee.used.toString()) - parseFloat(deletedVacation.days.toString())
      employee.remaining = employee.allowance - employee.used

      console.log(`📊 Reverted employee ${employee.name}: used ${oldUsed} → ${employee.used}, remaining: ${employee.remaining}`)
    }

    console.log(`🗑️ Deleted vacation: ${deletedVacation.id}`)

    return NextResponse.json({
      success: true,
      deletedVacation,
      employees: employees
    })

  } catch (error: any) {
    console.error('❌ DELETE /api/vacations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}