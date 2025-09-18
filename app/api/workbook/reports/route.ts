// Workbook Parity API - Employee Reports
// Provides exact workbook behavior calculations

import { NextRequest, NextResponse } from 'next/server'
import { workbookDatabase } from '@/lib/workbookDatabase'
import { EmployeeReport } from '@/lib/workbookParitySystem'

export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  requestId: string
}

// GET /api/workbook/reports - Get all employee reports with exact workbook calculations
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<EmployeeReport[]>>> {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employee_id')

    console.log(`[${requestId}] Generating workbook reports${employeeId ? ` for employee ${employeeId}` : ''}`)

    await workbookDatabase.initializeWorkbookData()

    let reports: EmployeeReport[]

    if (employeeId) {
      const report = await workbookDatabase.getEmployeeReport(employeeId)
      reports = report ? [report] : []
    } else {
      reports = await workbookDatabase.getAllEmployeeReports()
    }

    console.log(`[${requestId}] Successfully generated ${reports.length} workbook reports`)

    return NextResponse.json<ApiResponse<EmployeeReport[]>>({
      ok: true,
      data: reports,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error generating workbook reports'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// POST /api/workbook/reports/calculate - Force recalculation of specific employee report
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<EmployeeReport>>> {
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    const { employee_id } = body

    if (!employee_id) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'employee_id is required',
        requestId
      }, { status: 400 })
    }

    console.log(`[${requestId}] Force recalculating report for employee ${employee_id}`)

    await workbookDatabase.initializeWorkbookData()
    const report = await workbookDatabase.getEmployeeReport(employee_id)

    if (!report) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Employee not found or report generation failed',
        requestId
      }, { status: 404 })
    }

    console.log(`[${requestId}] Successfully recalculated report for ${report.name}`)
    console.log(`[${requestId}] Report summary: ${report.used_vacation} used, ${report.remaining_vacation} remaining`)

    return NextResponse.json<ApiResponse<EmployeeReport>>({
      ok: true,
      data: report,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error recalculating report'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}