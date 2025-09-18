// Workbook Parity API - Employee Daily Codes
// Handles individual day codes and date range operations

import { NextRequest, NextResponse } from 'next/server'
import { workbookDatabase } from '@/lib/workbookDatabase'
import { workbookParityEngine } from '@/lib/workbookParitySystem'

export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  requestId: string
}

// GET /api/workbook/codes?employee_id=xxx - Get daily codes for an employee
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<{
  employee_id: string,
  daily_codes: string[],
  date_array: string[]
}>>> {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employee_id')

    if (!employeeId) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'employee_id parameter is required',
        requestId
      }, { status: 400 })
    }

    console.log(`[${requestId}] Fetching daily codes for employee ${employeeId}`)

    await workbookDatabase.initializeWorkbookData()
    const dailyCodes = await workbookDatabase.getEmployeeDailyCodes(employeeId)
    const dateArray = workbookParityEngine.getDateArray()

    console.log(`[${requestId}] Successfully fetched daily codes (${dailyCodes.filter(c => c).length} non-empty days)`)

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        employee_id: employeeId,
        daily_codes: dailyCodes,
        date_array: dateArray
      },
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching daily codes'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// POST /api/workbook/codes - Set codes for date range
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<boolean>>> {
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    const { employee_id, code, start_date, end_date, daily_codes } = body

    console.log(`[${requestId}] Setting codes for employee ${employee_id}`)

    if (!employee_id) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'employee_id is required',
        requestId
      }, { status: 400 })
    }

    await workbookDatabase.initializeWorkbookData()

    let success = false

    if (daily_codes && Array.isArray(daily_codes)) {
      // Set entire daily codes array
      console.log(`[${requestId}] Setting complete daily codes array`)
      success = await workbookDatabase.setEmployeeDailyCodes(employee_id, daily_codes)
    } else if (code && start_date && end_date) {
      // Set code for date range
      console.log(`[${requestId}] Setting code '${code}' for range ${start_date} to ${end_date}`)
      success = await workbookDatabase.setEmployeeCodeForDateRange(employee_id, code, start_date, end_date)
    } else {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Either daily_codes array or (code, start_date, end_date) must be provided',
        requestId
      }, { status: 400 })
    }

    if (!success) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Failed to set employee codes',
        requestId
      }, { status: 500 })
    }

    console.log(`[${requestId}] Successfully set codes for employee ${employee_id}`)

    return NextResponse.json<ApiResponse<boolean>>({
      ok: true,
      data: true,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error setting codes'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// DELETE /api/workbook/codes - Clear codes for date range
export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse<boolean>>> {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employee_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!employeeId) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'employee_id parameter is required',
        requestId
      }, { status: 400 })
    }

    console.log(`[${requestId}] Clearing codes for employee ${employeeId}`)

    await workbookDatabase.initializeWorkbookData()

    if (startDate && endDate) {
      // Clear specific date range
      console.log(`[${requestId}] Clearing codes for range ${startDate} to ${endDate}`)
      const success = await workbookDatabase.setEmployeeCodeForDateRange(employeeId, '', startDate, endDate)

      return NextResponse.json<ApiResponse<boolean>>({
        ok: true,
        data: success,
        requestId
      })
    } else {
      // Clear all codes for employee
      console.log(`[${requestId}] Clearing all codes for employee`)
      const emptyCodes = new Array(365).fill('')
      const success = await workbookDatabase.setEmployeeDailyCodes(employeeId, emptyCodes)

      return NextResponse.json<ApiResponse<boolean>>({
        ok: true,
        data: success,
        requestId
      })
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error clearing codes'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}