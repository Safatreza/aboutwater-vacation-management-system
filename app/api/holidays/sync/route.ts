import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse, HolidayInsert } from '@/types/database'
import { getCurrentYearBerlin } from '@/lib/vacationCalculations'
import { googleCalendarService } from '@/lib/googleCalendarService'
import { mockDb, isMockMode } from '@/lib/mockDatabase'

// POST /api/holidays/sync - Sync German holidays from Google Calendar API
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    const year = body.year || getCurrentYearBerlin()
    const regionCode = body.region_code || 'DE'

    console.log(`[${requestId}] Syncing German holidays from Google Calendar API for year ${year}`)

    // Fetch holidays from Google Calendar API
    const holidays = await googleCalendarService.fetchGermanHolidays(year)

    console.log(`[${requestId}] Fetched ${holidays.length} holidays from Google Calendar API for ${year}`)
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database - adding holidays to in-memory store`)

      // Add holidays to mock database
      for (const holiday of holidays) {
        await mockDb.upsertHoliday({
          region_code: regionCode,
          date: holiday.date,
          name: holiday.name,
          source: 'google'
        })
      }

      console.log(`[${requestId}] Successfully added ${holidays.length} holidays to mock database`)

      return NextResponse.json<ApiResponse>({
        ok: true,
        data: {
          message: `Successfully synced German holidays from Google Calendar for ${year}`,
          year,
          region: regionCode,
          synced: holidays.length,
          total: holidays.length,
          holidays: holidays.slice(0, 10).map(h => ({ name: h.name, date: h.date, source: h.source }))
        },
        requestId
      })
    }
    
    // Use Google Calendar service to sync with database
    const syncResult = await googleCalendarService.syncHolidaysWithDatabase(
      year,
      async (holidaysToSync) => {
        // Prepare holidays for insertion into real database
        const holidayInserts: HolidayInsert[] = holidaysToSync.map(holiday => ({
          region_code: regionCode,
          date: holiday.date,
          name: holiday.name,
          source: 'google',
          created_at: new Date().toISOString()
        }))

        let syncedCount = 0
        for (const holidayInsert of holidayInserts) {
          try {
            const { data: existingHoliday, error: fetchError } = await supabaseAdmin
              .from('holidays')
              .select('id')
              .eq('region_code', holidayInsert.region_code || 'DE')
              .eq('date', holidayInsert.date || '')
              .single()

            if (!fetchError && existingHoliday) {
              // Update existing
              const validHoliday = existingHoliday as { id: string }
              await (supabaseAdmin as any)
                .from('holidays')
                .update({
                  name: holidayInsert.name,
                  source: holidayInsert.source
                })
                .eq('id', validHoliday.id)
            } else {
              // Insert new
              await (supabaseAdmin as any)
                .from('holidays')
                .insert(holidayInsert)
              syncedCount++
            }
          } catch (error) {
            console.warn(`[${requestId}] Error syncing holiday ${holidayInsert.name} on ${holidayInsert.date}:`, error)
          }
        }

        return syncedCount
      }
    )

    console.log(`[${requestId}] Successfully synced ${syncResult.synced} new holidays for year ${year}`)

    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        message: `Successfully synced German holidays from Google Calendar for ${year}`,
        year,
        region: regionCode,
        synced: syncResult.synced,
        total: syncResult.total,
        holidays: holidays.slice(0, 10).map(h => ({ name: h.name, date: h.date, source: h.source }))
      },
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error syncing holidays'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// GET /api/holidays/sync - Get sync status and available years
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID()
  
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    
    console.log(`[${requestId}] Getting holiday sync status`)
    
    // Get holiday count by year
    let query = supabaseAdmin
      .from('holidays')
      .select('date, region_code, source')
      .eq('region_code', 'DE')
    
    if (year) {
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      query = query.gte('date', yearStart).lte('date', yearEnd)
    }
    
    const { data: holidays, error } = await query
    
    if (error) {
      console.error(`[${requestId}] Error fetching holidays:`, error)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to fetch holidays: ${error.message}`,
        requestId
      }, { status: 500 })
    }
    
    // Group by year and source
    const stats = {} as any
    
    ((holidays as any) || []).forEach((holiday: any) => {
      const holidayYear = new Date(holiday.date).getFullYear().toString()
      if (!stats[holidayYear]) {
        stats[holidayYear] = { total: 0, google: 0, system: 0 }
      }
      stats[holidayYear].total++
      if (holiday.source === 'google') {
        stats[holidayYear].google++
      } else {
        stats[holidayYear].system++
      }
    })
    
    console.log(`[${requestId}] Holiday sync status retrieved`)
    
    return NextResponse.json<ApiResponse>({
      ok: true,
      data: {
        stats,
        currentYear: getCurrentYearBerlin(),
        apiConfigured: !!process.env.GOOGLE_API_KEY
      },
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error getting sync status'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}