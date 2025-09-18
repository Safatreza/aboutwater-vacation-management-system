import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponse, EmployeeInsert, Employee } from '@/types/database'
import { getCurrentYearBerlin } from '@/lib/vacationCalculations'
import { mockDb, isMockMode } from '@/lib/mockDatabase'
import { ABOUTWATER_EMPLOYEES, getAboutWaterEmployeesWithDefaults } from '@/lib/aboutwaterEmployees'

// GET /api/employees - Get all employees with vacation summary for a specific year
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<Employee[]>>> {
  const requestId = crypto.randomUUID()
  
  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || getCurrentYearBerlin().toString())
    
    console.log(`[${requestId}] Fetching employees for year ${year}`)
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database`)

      // Initialize with AboutWater employees if empty
      const existingEmployees = await mockDb.getEmployees()
      if (existingEmployees.length === 0) {
        console.log(`[${requestId}] Initializing mock database with AboutWater employees`)
        const aboutwaterEmployees = getAboutWaterEmployeesWithDefaults()

        for (const emp of aboutwaterEmployees) {
          await mockDb.createEmployee({
            name: emp.name,
            allowance_days: emp.allowance_days,
            used_vacation_days: emp.used_vacation_days,
            remaining_vacation: emp.remaining_vacation,
            region_code: emp.region,
            color: emp.color,
            active: true
          })
        }
      }

      const employees = await mockDb.getEmployees()
      console.log(`[${requestId}] Successfully fetched ${employees.length} employees (mock mode)`)

      return NextResponse.json<ApiResponse<Employee[]>>({
        ok: true,
        data: employees,
        requestId
      })
    }
    
    // Check if AboutWater employees exist, initialize if missing
    const { data: aboutwaterCheck } = await supabase
      .from('employees')
      .select('name')
      .eq('name', 'Andreas Pöppe')
      .eq('active', true)
      .limit(1)

    if (!aboutwaterCheck || aboutwaterCheck.length === 0) {
      console.log(`[${requestId}] Initializing database with AboutWater employees`)
      const aboutwaterEmployees = getAboutWaterEmployeesWithDefaults()

      const employeeInserts: EmployeeInsert[] = aboutwaterEmployees.map(emp => ({
        name: emp.name,
        allowance_days: emp.allowance_days,
        used_vacation_days: emp.used_vacation_days,
        remaining_vacation: emp.remaining_vacation,
        region_code: emp.region,
        color: emp.color,
        active: true,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await (supabase as any)
        .from('employees')
        .insert(employeeInserts)

      if (insertError) {
        console.warn(`[${requestId}] Error initializing employees:`, insertError)
      } else {
        console.log(`[${requestId}] Successfully initialized ${employeeInserts.length} AboutWater employees`)
      }
    }

    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error(`[${requestId}] Database error:`, error)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Database error: ${error.message}`,
        requestId
      }, { status: 500 })
    }

    console.log(`[${requestId}] Successfully fetched ${employees?.length || 0} employees`)
    
    return NextResponse.json<ApiResponse<Employee[]>>({
      ok: true,
      data: employees || [],
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching employees'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// POST /api/employees - Create new employee
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Employee>>> {
  const requestId = crypto.randomUUID()
  
  try {
    const body: EmployeeInsert = await req.json()
    
    console.log(`[${requestId}] Creating employee:`, { name: body.name, allowance_days: body.allowance_days })

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee name is required and cannot be empty',
        requestId
      }, { status: 400 })
    }

    if (!body.allowance_days || body.allowance_days < 1 || body.allowance_days > 50) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Allowance days must be between 1 and 50',
        requestId
      }, { status: 400 })
    }

    // Clean the data
    const cleanEmployee: EmployeeInsert = {
      name: body.name.trim(),
      allowance_days: body.allowance_days,
      used_vacation_days: body.used_vacation_days || 0,
      remaining_vacation: body.remaining_vacation || body.allowance_days,
      region_code: body.region_code || 'DE',
      color: body.color,
      active: true
    }
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database to create employee`)
      const employee = await mockDb.createEmployee(cleanEmployee)
      
      console.log(`[${requestId}] Successfully created employee with ID: ${employee.id} (mock mode)`)

      return NextResponse.json<ApiResponse<Employee>>({
        ok: true,
        data: employee,
        requestId
      }, { status: 201 })
    }

    const { data: employee, error } = await (supabase as any)
      .from('employees')
      .insert([cleanEmployee])
      .select()
      .single()

    if (error) {
      console.error(`[${requestId}] Database error:`, error)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to create employee: ${error.message}`,
        requestId
      }, { status: 500 })
    }

    console.log(`[${requestId}] Successfully created employee with ID: ${employee?.id}`)
    
    return NextResponse.json<ApiResponse<Employee>>({
      ok: true,
      data: employee!,
      requestId
    }, { status: 201 })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating employee'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}