// Workbook Parity API - Employee Operations
// Provides exact workbook behavior while maintaining existing API compatibility

import { NextRequest, NextResponse } from 'next/server'
import { workbookDatabase } from '@/lib/workbookDatabase'
import { Employee } from '@/lib/workbookParitySystem'

export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  requestId: string
}

// GET /api/workbook/employees - Get all workbook employees with 2025 calculations
export async function GET(): Promise<NextResponse<ApiResponse<Employee[]>>> {
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] Fetching workbook employees`)

    await workbookDatabase.initializeWorkbookData()
    const employees = await workbookDatabase.getWorkbookEmployees()

    console.log(`[${requestId}] Successfully fetched ${employees.length} workbook employees`)

    return NextResponse.json<ApiResponse<Employee[]>>({
      ok: true,
      data: employees,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching workbook employees'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// POST /api/workbook/employees - Create new workbook employee
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Employee>>> {
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    console.log(`[${requestId}] Creating workbook employee:`, body.name)

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee name is required',
        requestId
      }, { status: 400 })
    }

    const employeeData: Omit<Employee, 'id'> = {
      name: body.name.trim(),
      carryover_prev_year: body.carryover_prev_year || 0,
      allowance_current_year: body.allowance_current_year || 25,
      active: body.active !== false
    }

    const employee = await workbookDatabase.createWorkbookEmployee(employeeData)

    if (!employee) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Failed to create workbook employee',
        requestId
      }, { status: 500 })
    }

    console.log(`[${requestId}] Successfully created workbook employee with ID: ${employee.id}`)

    return NextResponse.json<ApiResponse<Employee>>({
      ok: true,
      data: employee,
      requestId
    }, { status: 201 })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating workbook employee'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}