import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponse, VacationInsert, Vacation } from '@/types/database'
import { 
  calculateWorkingDaysCount, 
  validateVacationDates, 
  checkVacationOverlap,
  getHolidaysForYear,
  getCurrentYearBerlin
} from '@/lib/vacationCalculations'
import { mockDb, isMockMode } from '@/lib/mockDatabase'

// GET /api/vacations - Get vacations with filters
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Vacation[]>>> {
  const requestId = crypto.randomUUID()
  
  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employee_id')
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    
    console.log(`[${requestId}] Fetching vacations with filters:`, { employeeId, year })
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database`)
      const vacations = await mockDb.getVacations(employeeId || undefined, year)
      
      console.log(`[${requestId}] Successfully fetched ${vacations.length} vacations (mock mode)`)
      
      return NextResponse.json<ApiResponse<Vacation[]>>({
        ok: true,
        data: vacations,
        requestId
      })
    }

    // Check if we need to initialize with sample vacation data
    const { data: vacationCheck } = await supabase
      .from('vacations')
      .select('id')
      .limit(1)

    if (!vacationCheck || vacationCheck.length === 0) {
      console.log(`[${requestId}] Initializing database with sample vacation data`)

      // Get employees to map vacation data
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .eq('active', true)

      if (employees && employees.length > 0) {
        // Create sample vacation entries
        const sampleVacations = [
          {
            employee_id: employees.find(e => e.name === 'Andreas Pöppe')?.id,
            start_date: '2025-03-10',
            end_date: '2025-03-14',
            working_days: 5,
            note: 'Spring Break'
          },
          {
            employee_id: employees.find(e => e.name === 'Carmen Berger')?.id,
            start_date: '2025-06-15',
            end_date: '2025-06-20',
            working_days: 4,
            note: 'Summer Vacation'
          },
          {
            employee_id: employees.find(e => e.name === 'Florian Gräf')?.id,
            start_date: '2025-07-07',
            end_date: '2025-07-18',
            working_days: 10,
            note: 'Summer Holiday'
          },
          {
            employee_id: employees.find(e => e.name === 'Petra Gräf')?.id,
            start_date: '2025-08-25',
            end_date: '2025-08-29',
            working_days: 5,
            note: 'Late Summer Break'
          },
          {
            employee_id: employees.find(e => e.name === 'Hannes Kolm')?.id,
            start_date: '2025-12-23',
            end_date: '2025-12-30',
            working_days: 6,
            note: 'Christmas Holidays'
          }
        ].filter(v => v.employee_id) // Only include vacations where employee was found

        if (sampleVacations.length > 0) {
          const { error: insertError } = await supabase
            .from('vacations')
            .insert(sampleVacations)

          if (insertError) {
            console.warn(`[${requestId}] Error initializing sample vacations:`, insertError)
          } else {
            console.log(`[${requestId}] Successfully initialized ${sampleVacations.length} sample vacation entries`)
          }
        }
      }
    }

    let query = supabase
      .from('vacations')
      .select(`
        *,
        employees:employee_id (
          id,
          name,
          region_code
        )
      `)
      .order('start_date', { ascending: false })
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    if (year) {
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      query = query.gte('start_date', yearStart).lte('end_date', yearEnd)
    }
    
    const { data: vacations, error } = await query
    
    if (error) {
      console.error(`[${requestId}] Error fetching vacations:`, error)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to fetch vacations: ${error.message}`,
        requestId
      }, { status: 500 })
    }
    
    console.log(`[${requestId}] Successfully fetched ${vacations?.length || 0} vacations`)
    
    return NextResponse.json<ApiResponse<Vacation[]>>({
      ok: true,
      data: vacations || [],
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching vacations'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// POST /api/vacations - Create new vacation
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Vacation>>> {
  const requestId = crypto.randomUUID()
  
  try {
    const body: VacationInsert & { employee_id: string } = await req.json()
    
    console.log(`[${requestId}] Creating vacation:`, {
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date
    })
    
    // Validate required fields
    if (!body.employee_id || !body.start_date || !body.end_date) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee ID, start date, and end date are required',
        requestId
      }, { status: 400 })
    }
    
    // Validate date format and logic
    const dateValidation = validateVacationDates(body.start_date, body.end_date)
    if (!dateValidation.isValid) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: dateValidation.error,
        requestId
      }, { status: 400 })
    }
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database to create vacation`)
      
      // Check if employee exists
      const employee = await mockDb.getEmployee(body.employee_id)
      if (!employee) {
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: 'Employee not found or inactive',
          requestId
        }, { status: 404 })
      }
      
      // Get existing vacations for overlap check
      const existingVacations = await mockDb.getVacations(body.employee_id)
      
      // Check for overlaps
      const overlapCheck = checkVacationOverlap(
        body.start_date,
        body.end_date,
        existingVacations
      )
      
      if (overlapCheck.hasOverlap) {
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: `Vacation dates overlap with existing vacation from ${overlapCheck.conflictingVacation?.start_date} to ${overlapCheck.conflictingVacation?.end_date}`,
          requestId
        }, { status: 400 })
      }
      
      // Get holidays for working day calculation
      const startYear = new Date(body.start_date).getFullYear()
      const holidays = await mockDb.getHolidays(employee.region_code, startYear)
      
      // Calculate working days
      const workingDays = calculateWorkingDaysCount(
        body.start_date,
        body.end_date,
        holidays
      )
      
      if (workingDays === 0) {
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: 'Vacation must include at least one working day',
          requestId
        }, { status: 400 })
      }
      
      // Create vacation record
      const vacationData: VacationInsert = {
        employee_id: body.employee_id,
        start_date: body.start_date,
        end_date: body.end_date,
        note: body.note || null,
        working_days: workingDays
      }
      
      const vacation = await mockDb.createVacation(vacationData)
      
      console.log(`[${requestId}] Successfully created vacation with ${workingDays} working days (mock mode)`)
      
      return NextResponse.json<ApiResponse<Vacation>>({
        ok: true,
        data: vacation,
        requestId
      }, { status: 201 })
    }
    
    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', body.employee_id)
      .eq('active', true)
      .single()
    
    if (employeeError || !employee) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee not found or inactive',
        requestId
      }, { status: 404 })
    }
    
    // Get existing vacations for overlap check
    const { data: existingVacations, error: vacationError } = await supabase
      .from('vacations')
      .select('id, start_date, end_date')
      .eq('employee_id', body.employee_id)
    
    if (vacationError) {
      console.error(`[${requestId}] Error fetching existing vacations:`, vacationError)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Error checking for vacation overlaps',
        requestId
      }, { status: 500 })
    }
    
    // Check for overlaps
    const overlapCheck = checkVacationOverlap(
      body.start_date,
      body.end_date,
      existingVacations || []
    )
    
    if (overlapCheck.hasOverlap) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Vacation dates overlap with existing vacation from ${overlapCheck.conflictingVacation?.start_date} to ${overlapCheck.conflictingVacation?.end_date}`,
        requestId
      }, { status: 400 })
    }
    
    // Get holidays for working day calculation
    const startYear = new Date(body.start_date).getFullYear()
    const { data: holidays } = await supabase
      .from('holidays')
      .select('*')
      .eq('region_code', (employee as any).region_code)
      .gte('date', `${startYear}-01-01`)
      .lte('date', `${startYear}-12-31`)
    
    // Calculate working days
    const workingDays = calculateWorkingDaysCount(
      body.start_date,
      body.end_date,
      holidays || []
    )
    
    if (workingDays === 0) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Vacation must include at least one working day',
        requestId
      }, { status: 400 })
    }
    
    // Create vacation record
    const vacationData: VacationInsert = {
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      note: body.note || null,
      working_days: workingDays
    }
    
    const { data: vacation, error } = await (supabase as any)
      .from('vacations')
      .insert(vacationData)
      .select(`
        *,
        employees:employee_id (
          id,
          name,
          region_code
        )
      `)
      .single()
    
    if (error) {
      console.error(`[${requestId}] Error creating vacation:`, error)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to create vacation: ${error.message}`,
        requestId
      }, { status: 500 })
    }
    
    console.log(`[${requestId}] Successfully created vacation with ${workingDays} working days`)
    
    return NextResponse.json<ApiResponse<Vacation>>({
      ok: true,
      data: vacation,
      requestId
    }, { status: 201 })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating vacation'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}