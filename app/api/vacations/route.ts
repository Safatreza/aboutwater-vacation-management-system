import { NextResponse } from 'next/server'
import { vacations } from '@/lib/supabaseStorage'

// GET /api/vacations - Get all vacations from Supabase
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')
    const year = searchParams.get('year')

    console.log('📨 GET /api/vacations - starting', { employeeId, year })

    let vacationList

    if (employeeId) {
      vacationList = await vacations.getByEmployee(employeeId)
    } else if (year) {
      vacationList = await vacations.getByYear(parseInt(year))
    } else {
      vacationList = await vacations.getAll()
    }

    console.log(`📖 Loaded ${vacationList.length} vacations from Supabase`)

    return NextResponse.json(vacationList)
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

    if (!body.working_days && !body.days) {
      return NextResponse.json({ error: 'working_days or days is required' }, { status: 400 })
    }

    // Create new vacation in Supabase
    const newVacation = await vacations.create({
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      working_days: body.working_days || body.days,
      note: body.note || body.reason || null
    })

    console.log(`✅ Successfully created vacation for employee ${body.employee_id}`)
    console.log('📋 Vacation details:', {
      id: newVacation.id,
      dates: `${newVacation.start_date} to ${newVacation.end_date}`,
      workingDays: newVacation.working_days
    })

    return NextResponse.json({
      success: true,
      vacation: newVacation
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ POST /api/vacations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/vacations - Update vacation
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    console.log('📍 PUT /api/vacations - updating vacation:', body.id)

    // Validate required fields
    if (!body.id) {
      return NextResponse.json({ error: 'Vacation ID is required' }, { status: 400 })
    }

    const updatedVacation = await vacations.update(body.id, {
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      working_days: body.working_days || body.days,
      note: body.note || body.reason || null
    })

    console.log(`✅ Successfully updated vacation: ${updatedVacation.id}`)

    return NextResponse.json({
      success: true,
      vacation: updatedVacation
    })

  } catch (error: any) {
    console.error('❌ PUT /api/vacations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/vacations - Delete vacation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vacationId = searchParams.get('id')

    if (!vacationId) {
      return NextResponse.json({ error: 'Vacation ID is required' }, { status: 400 })
    }

    console.log('📍 DELETE /api/vacations - deleting vacation:', vacationId)

    await vacations.delete(vacationId)

    console.log(`✅ Successfully deleted vacation: ${vacationId}`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ DELETE /api/vacations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}