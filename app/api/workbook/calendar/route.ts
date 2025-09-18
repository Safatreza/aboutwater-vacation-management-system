// Workbook Parity API - Calendar and Date Operations
// Provides 2025 date array and holiday flags

import { NextRequest, NextResponse } from 'next/server'
import { workbookDatabase } from '@/lib/workbookDatabase'
import { workbookParityEngine } from '@/lib/workbookParitySystem'

export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  requestId: string
}

export interface CalendarData {
  year: 2025
  dates: string[]           // 365 dates from 2025-01-01 to 2025-12-31
  weekdays: number[]        // Mon=1 … Sun=7
  flags: {
    ferien: boolean[]       // School breaks/holidays
    feiertag: boolean[]     // Public holidays
    betriebsschliessung: boolean[] // Company closures
  }
  holiday_ranges: any[]     // Full holiday range data
}

// GET /api/workbook/calendar - Get complete 2025 calendar with flags
export async function GET(): Promise<NextResponse<ApiResponse<CalendarData>>> {
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] Generating workbook calendar for 2025`)

    await workbookDatabase.initializeWorkbookData()

    const dates = workbookParityEngine.getDateArray()
    const weekdays = workbookParityEngine.getWeekdayArray()
    const holidayRanges = await workbookDatabase.getHolidayRanges()

    // Initialize flag arrays
    const ferien = new Array(365).fill(false)
    const feiertag = new Array(365).fill(false)
    const betriebsschliessung = new Array(365).fill(false)

    // Set flags for each day
    for (let dayIndex = 0; dayIndex < 365; dayIndex++) {
      const flags = workbookParityEngine.getDateFlags(dayIndex)
      ferien[dayIndex] = flags.isFerien
      feiertag[dayIndex] = flags.isFeiertag
      betriebsschliessung[dayIndex] = flags.isBetriebsschliessung
    }

    const calendarData: CalendarData = {
      year: 2025,
      dates,
      weekdays,
      flags: {
        ferien,
        feiertag,
        betriebsschliessung
      },
      holiday_ranges: holidayRanges
    }

    console.log(`[${requestId}] Successfully generated calendar with ${holidayRanges.length} holiday ranges`)

    return NextResponse.json<ApiResponse<CalendarData>>({
      ok: true,
      data: calendarData,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error generating calendar'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// GET /api/workbook/calendar/day?date=2025-01-01 - Get specific day info
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{
  date: string
  day_index: number
  weekday: number
  flags: {
    isFerien: boolean
    isFeiertag: boolean
    isBetriebsschliessung: boolean
  }
  is_weekend: boolean
}>>> {
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    const { date } = body

    if (!date) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'date is required (YYYY-MM-DD format)',
        requestId
      }, { status: 400 })
    }

    console.log(`[${requestId}] Getting day info for ${date}`)

    await workbookDatabase.initializeWorkbookData()

    const dayIndex = workbookParityEngine.getIndexByDate(date)

    if (dayIndex === -1) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Date not found in 2025 calendar',
        requestId
      }, { status: 404 })
    }

    const weekdays = workbookParityEngine.getWeekdayArray()
    const flags = workbookParityEngine.getDateFlags(dayIndex)
    const isWeekend = workbookParityEngine.isWeekend(dayIndex)

    const dayInfo = {
      date,
      day_index: dayIndex,
      weekday: weekdays[dayIndex],
      flags,
      is_weekend: isWeekend
    }

    console.log(`[${requestId}] Day ${date}: index=${dayIndex}, weekday=${weekdays[dayIndex]}, weekend=${isWeekend}`)

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: dayInfo,
      requestId
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error getting day info'
    console.error(`[${requestId}] Error:`, errorMessage)

    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}