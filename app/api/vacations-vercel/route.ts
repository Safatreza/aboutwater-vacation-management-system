import { NextResponse } from 'next/server'

// Shared in-memory storage with employees endpoint
const defaultEmployees = [
  { id: '1', name: 'Andreas Pöppe', allowance: 38.0, used: 28.5, remaining: 9.5, color: '#FF0000' },
  { id: '2', name: 'Anna Kropfitsch', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#0000FF' },
  { id: '3', name: 'Antonio Svagusa', allowance: 26.0, used: 24.0, remaining: 2.0, color: '#008000' },
  { id: '4', name: 'Carmen Berger', allowance: 40.0, used: 22.0, remaining: 18.0, color: '#FF8000' },
  { id: '5', name: 'Cengiz Kina', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#800080' },
  { id: '6', name: 'Christian Irrgang', allowance: 34.0, used: 28.0, remaining: 6.0, color: '#008080' },
  { id: '7', name: 'Daniel Hegemann', allowance: 32.0, used: 29.0, remaining: 3.0, color: '#8B4513' },
  { id: '8', name: 'Estaline Philander', allowance: 30.0, used: 22.0, remaining: 8.0, color: '#FF1493' },
  { id: '9', name: 'Farouk Chasan', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#000080' },
  { id: '10', name: 'Florian Gräf', allowance: 47.0, used: 27.0, remaining: 20.0, color: '#800000' },
  { id: '11', name: 'Giorgi Lomidze', allowance: 30.0, used: 0.0, remaining: 30.0, color: '#2F4F4F' },
  { id: '12', name: 'Hannes Kolm', allowance: 33.0, used: 24.0, remaining: 9.0, color: '#B22222' },
  { id: '13', name: 'Josefine Mättig', allowance: 29.0, used: 29.0, remaining: 0.0, color: '#228B22' },
  { id: '14', name: 'Matthias Herbst', allowance: 36.0, used: 23.0, remaining: 13.0, color: '#4B0082' },
  { id: '15', name: 'Max Sanktjohanser', allowance: 30.0, used: 23.0, remaining: 7.0, color: '#DC143C' },
  { id: '16', name: 'Michael Reiser', allowance: 20.0, used: 19.5, remaining: 0.5, color: '#00CED1' },
  { id: '17', name: 'Mihaela Abmayr', allowance: 27.0, used: 19.0, remaining: 8.0, color: '#FF6347' },
  { id: '18', name: 'Petra Gräf', allowance: 35.0, used: 21.0, remaining: 14.0, color: '#4682B4' },
  { id: '19', name: 'René Kühn', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#D2691E' },
  { id: '20', name: 'Safat Majumder', allowance: 30.0, used: 7.0, remaining: 23.0, color: '#FF4500' },
  { id: '21', name: 'Sönke Rocho', allowance: 41.0, used: 31.0, remaining: 10.0, color: '#8B008B' },
  { id: '22', name: 'Thierry Brunner', allowance: 37.0, used: 28.0, remaining: 9.0, color: '#556B2F' }
]

// Global in-memory storage
let vacations: any[] = []
let employees = [...defaultEmployees]

export async function GET() {
  try {
    console.log('📍 GET /api/vacations-vercel - Returning in-memory vacation data')
    return NextResponse.json(vacations)
  } catch (error: any) {
    console.error('❌ Error in vacations endpoint:', error)
    return NextResponse.json({
      error: 'Failed to get vacations',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('📍 POST /api/vacations-vercel - Adding vacation (in-memory)')

    const body = await request.json()
    console.log('📍 Request body:', body)

    // Validate required fields
    const validationErrors: string[] = []
    if (!body.employee_id) validationErrors.push('employee_id is required')
    if (!body.start_date) validationErrors.push('start_date is required')
    if (!body.end_date) validationErrors.push('end_date is required')
    if (!body.days && body.days !== 0) validationErrors.push('days is required')

    if (validationErrors.length > 0) {
      console.error('❌ Validation failed:', validationErrors)
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 })
    }

    // Create new vacation
    const newVacation = {
      id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      days: parseFloat(body.days.toString()),
      reason: body.reason || 'Urlaub (ganzer Tag)',
      created_at: new Date().toISOString()
    }

    console.log('📍 Created vacation:', newVacation)

    // Add to in-memory storage
    vacations.push(newVacation)

    // Update employee data
    const employeeIndex = employees.findIndex(emp => emp.id === newVacation.employee_id)
    console.log('📍 Employee index found:', employeeIndex)

    if (employeeIndex !== -1) {
      const employee = employees[employeeIndex]
      const oldUsed = employee.used
      const vacationDays = parseFloat(newVacation.days.toString())

      employee.used = parseFloat(employee.used.toString()) + vacationDays
      employee.remaining = parseFloat(employee.allowance.toString()) - employee.used

      console.log(`📊 Updated employee ${employee.name}: used ${oldUsed} → ${employee.used}, remaining: ${employee.remaining}`)
    } else {
      console.warn(`⚠️ Employee not found with ID: ${newVacation.employee_id}`)
    }

    console.log('✅ Successfully added vacation (in-memory)')

    return NextResponse.json({
      success: true,
      vacation: newVacation,
      employees: employees,
      message: `Added ${newVacation.days} days vacation (stored in memory for demo)`
    })

  } catch (error: any) {
    console.error('❌ POST /api/vacations-vercel error:', error)
    return NextResponse.json({
      error: 'Failed to add vacation',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    console.log(`🗑️ DELETE /api/vacations-vercel - Deleting vacation: ${id}`)

    const vacationIndex = vacations.findIndex(vac => vac.id === id)

    if (vacationIndex === -1) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    const deletedVacation = vacations[vacationIndex]
    vacations.splice(vacationIndex, 1)

    // Revert employee data
    const employeeIndex = employees.findIndex(emp => emp.id === deletedVacation.employee_id)

    if (employeeIndex !== -1) {
      const employee = employees[employeeIndex]
      const oldUsed = employee.used
      employee.used = parseFloat(employee.used.toString()) - parseFloat(deletedVacation.days.toString())
      employee.remaining = parseFloat(employee.allowance.toString()) - employee.used

      console.log(`📊 Reverted employee ${employee.name}: used ${oldUsed} → ${employee.used}, remaining: ${employee.remaining}`)
    }

    console.log(`🗑️ Deleted vacation: ${deletedVacation.id}`)

    return NextResponse.json({
      success: true,
      deletedVacation,
      employees: employees
    })

  } catch (error: any) {
    console.error('❌ DELETE /api/vacations-vercel error:', error)
    return NextResponse.json({
      error: 'Failed to delete vacation',
      details: error.message
    }, { status: 500 })
  }
}