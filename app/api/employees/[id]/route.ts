import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse, Employee, EmployeeUpdate } from '@/types/database'
import { mockDb, isMockMode } from '@/lib/mockDatabase'
import { validateEnvironment } from '@/lib/env'

// GET /api/employees/[id] - Get single employee by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Employee>>> {
  const requestId = crypto.randomUUID()
  const employeeId = params.id
  
  try {
    console.log(`[${requestId}] Fetching employee with ID: ${employeeId}`)

    // Check environment variables
    const envCheck = validateEnvironment()
    if (!envCheck.valid) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: envCheck.error || 'Environment not configured',
        requestId
      }, { status: 500 })
    }

    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database`)
      const employee = await mockDb.getEmployee(employeeId)
      
      if (!employee) {
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: 'Employee not found',
          requestId
        }, { status: 404 })
      }
      
      console.log(`[${requestId}] Successfully fetched employee (mock mode)`)
      
      return NextResponse.json<ApiResponse<Employee>>({
        ok: true,
        data: employee,
        requestId
      })
    }
    
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('active', true)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: 'Employee not found',
          requestId
        }, { status: 404 })
      }
      
      console.error(`[${requestId}] Database error:`, error)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Database error: ${error.message}`,
        requestId
      }, { status: 500 })
    }
    
    console.log(`[${requestId}] Successfully fetched employee`)
    
    return NextResponse.json<ApiResponse<Employee>>({
      ok: true,
      data: employee,
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching employee'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// PATCH /api/employees/[id] - Update employee fields (e.g., allowance_days)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Employee>>> {
  const requestId = crypto.randomUUID()
  const employeeId = params.id

  try {
    console.log(`[${requestId}] Updating employee with ID: ${employeeId}`)

    const body = await req.json()
    const { allowance_days, name, region_code } = body

    // Validate input
    if (allowance_days !== undefined && (typeof allowance_days !== 'number' || allowance_days < 1 || allowance_days > 365)) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Vacation allowance must be a number between 1 and 365',
        requestId
      }, { status: 400 })
    }

    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database to update employee`)

      const updates: any = {}
      if (allowance_days !== undefined) updates.allowance_days = allowance_days
      if (name !== undefined) updates.name = name
      if (region_code !== undefined) updates.region_code = region_code

      const updatedEmployee = await mockDb.updateEmployee(employeeId, updates)

      console.log(`[${requestId}] Successfully updated employee (mock mode)`)

      return NextResponse.json<ApiResponse<Employee>>({
        ok: true,
        data: updatedEmployee,
        requestId
      })
    }

    // Check if employee exists
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('active', true)
      .single()

    if (fetchError || !employee) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee not found',
        requestId
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (allowance_days !== undefined) updateData.allowance_days = allowance_days
    if (name !== undefined) updateData.name = name
    if (region_code !== undefined) updateData.region_code = region_code

    // Update employee
    const { data: updatedEmployee, error: updateError } = await (supabaseAdmin as any)
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .select()
      .single()

    if (updateError) {
      console.error(`[${requestId}] Error updating employee:`, updateError)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to update employee: ${updateError.message}`,
        requestId
      }, { status: 500 })
    }

    console.log(`[${requestId}] Successfully updated employee`)

    return NextResponse.json<ApiResponse<Employee>>({
      ok: true,
      data: updatedEmployee,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error updating employee'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// DELETE /api/employees/[id] - Delete employee (soft delete if has vacations)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ success: boolean; message: string }>>> {
  const requestId = crypto.randomUUID()
  const employeeId = params.id
  
  try {
    console.log(`[${requestId}] Deleting employee with ID: ${employeeId}`)
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database to delete employee`)
      const result = await mockDb.deleteEmployee(employeeId)
      
      console.log(`[${requestId}] Delete result (mock mode):`, result)
      
      return NextResponse.json<ApiResponse<{ success: boolean; message: string }>>({
        ok: true,
        data: result,
        requestId
      })
    }
    
    // Check if employee exists and get their information
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()
    
    if (fetchError || !employee) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee not found',
        requestId
      }, { status: 404 })
    }
    
    // Type assertion to help TypeScript understand the employee is not null
    const validEmployee = employee as Employee
    
    if (!validEmployee.active) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee is already inactive',
        requestId
      }, { status: 400 })
    }
    
    // Check if employee has any vacation records
    const { data: vacations, error: vacationError } = await supabaseAdmin
      .from('vacations')
      .select('id')
      .eq('employee_id', employeeId)
      .limit(1)
    
    if (vacationError) {
      console.error(`[${requestId}] Error checking vacations:`, vacationError)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to check vacation records: ${vacationError.message}`,
        requestId
      }, { status: 500 })
    }
    
    let message: string
    
    if (vacations && vacations.length > 0) {
      // Soft delete - set active to false
      const updateData = { active: false }
      const { error: updateError } = await (supabaseAdmin as any)
        .from('employees')
        .update(updateData)
        .eq('id', employeeId)
      
      if (updateError) {
        console.error(`[${requestId}] Error deactivating employee:`, updateError)
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: `Failed to deactivate employee: ${updateError.message}`,
          requestId
        }, { status: 500 })
      }
      
      message = `Employee ${validEmployee.name} has been deactivated (has vacation records)`
      console.log(`[${requestId}] Employee deactivated (soft delete)`)
    } else {
      // Hard delete - completely remove from database
      const { error: deleteError } = await supabaseAdmin
        .from('employees')
        .delete()
        .eq('id', employeeId)
      
      if (deleteError) {
        console.error(`[${requestId}] Error deleting employee:`, deleteError)
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: `Failed to delete employee: ${deleteError.message}`,
          requestId
        }, { status: 500 })
      }
      
      message = `Employee ${validEmployee.name} has been deleted`
      console.log(`[${requestId}] Employee deleted (hard delete)`)
    }
    
    return NextResponse.json<ApiResponse<{ success: boolean; message: string }>>({
      ok: true,
      data: { success: true, message },
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error deleting employee'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}