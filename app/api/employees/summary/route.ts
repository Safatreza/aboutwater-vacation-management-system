import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponse } from '@/types/database'
import { getCurrentYearBerlin } from '@/lib/vacationCalculations'
import { mockDb, isMockMode } from '@/lib/mockDatabase'

interface EmployeeSummary {
  employee_id: string
  employee_name: string
  vacation_allowance: number
  used_days: number
  remaining_days: number
  employee_region: string
  color?: string
}

// GET /api/employees/summary - Get employee vacation summary for a specific year
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<EmployeeSummary[]>>> {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || getCurrentYearBerlin().toString())

    console.log(`[${requestId}] Fetching employee summary for year ${year}`)

    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database - returning DYNAMIC vacation data from localStorage`)

      // Use dynamic mock database that reflects vacation changes
      const employees = await mockDb.getEmployees()

      const summaries: EmployeeSummary[] = employees.map(emp => ({
        employee_id: emp.id,
        employee_name: emp.name,
        vacation_allowance: emp.allowance_days,
        used_days: emp.used_vacation_days || 0,
        remaining_days: emp.remaining_vacation || emp.allowance_days,
        employee_region: emp.region_code || 'DE',
        color: emp.color
      }))

      console.log(`[${requestId}] Successfully returned ${summaries.length} employees with DYNAMIC data (mock mode)`)

      return NextResponse.json<ApiResponse<EmployeeSummary[]>>({
        ok: true,
        data: summaries,
        requestId
      })
    }

    // Use real Supabase database - also return exact data from database
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('active', true)
      .order('name') as { data: any[] | null, error: any }

    if (employeeError) {
      console.error(`[${requestId}] Error fetching employees:`, employeeError)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to fetch employees: ${employeeError.message}`,
        requestId
      }, { status: 500 })
    }

    // Convert database employees to summary format using exact stored values
    const summaries: EmployeeSummary[] = (employees || []).map(emp => ({
      employee_id: emp.id,
      employee_name: emp.name,
      vacation_allowance: emp.allowance_days,
      used_days: emp.used_vacation_days || 0,
      remaining_days: emp.remaining_vacation || emp.allowance_days,
      employee_region: emp.region_code || 'DE',
      color: emp.color
    }))

    console.log(`[${requestId}] Successfully returned ${summaries.length} employees with exact stored vacation data`)

    return NextResponse.json<ApiResponse<EmployeeSummary[]>>({
      ok: true,
      data: summaries,
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error calculating employee summaries'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}