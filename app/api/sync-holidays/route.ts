import { NextRequest, NextResponse } from 'next/server'
import { fetchGermanHolidays, syncGermanHolidays } from '@/lib/googleCalendar'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    console.log(`🔄 Syncing German holidays for year ${year}...`)

    // Fetch holidays from Google Calendar API
    const holidays = await fetchGermanHolidays(year)

    if (holidays.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No holidays found',
        year
      })
    }

    console.log(`📅 Found ${holidays.length} holidays for ${year}`)

    // Insert holidays into Supabase
    const insertPromises = holidays.map(async holiday => {
      try {
        const { data, error } = await (supabase as any)
          .from('holidays')
          .upsert(holiday, {
            onConflict: 'holiday_region,holiday_date,holiday_name',
            ignoreDuplicates: true
          })
          .select()

        if (error) {
          console.error(`Error inserting holiday ${holiday.name}:`, error)
          return { success: false, holiday: holiday.name, error: error.message }
        }

        return { success: true, holiday: holiday.name, data }
      } catch (err) {
        console.error(`Exception inserting holiday ${holiday.name}:`, err)
        return { success: false, holiday: holiday.name, error: 'Database error' }
      }
    })

    const results = await Promise.all(insertPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)

    console.log(`✅ Successfully synced ${successful}/${holidays.length} holidays`)

    if (failed.length > 0) {
      console.warn('Failed to sync some holidays:', failed)
    }

    // Update last sync timestamp
    try {
      await (supabase as any)
        .from('settings')
        .update({ last_holiday_sync_at: new Date().toISOString() })
        .eq('id', 1)
    } catch (err) {
      console.warn('Could not update last sync timestamp:', err)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${successful} holidays for year ${year}`,
      year,
      synced: successful,
      failed: failed.length,
      holidays: holidays.map(h => ({
        date: h.date,
        name: h.name,
        source: h.source
      })),
      errors: failed.map(f => f.error)
    })

  } catch (error) {
    console.error('Holiday sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { years = [new Date().getFullYear()] } = body

    console.log(`🔄 Bulk syncing holidays for years: ${years.join(', ')}`)

    const results = []

    for (const year of years) {
      try {
        const syncResult = await syncGermanHolidays(year)
        results.push({
          year,
          success: syncResult.synced > 0,
          synced: syncResult.synced,
          errors: syncResult.errors
        })
      } catch (error) {
        results.push({
          year,
          success: false,
          synced: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        })
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0)
    const successful = results.filter(r => r.success).length

    return NextResponse.json({
      success: successful > 0,
      message: `Synced holidays for ${successful}/${years.length} years`,
      totalSynced,
      results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}