import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { mockDb, isMockMode } from '@/lib/mockDatabase'
import { ApiResponse } from '@/types/database'
import { getCurrentYearBerlin } from '@/lib/vacationCalculations'

// GET /api/holidays - Get holidays for a specific region and year
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID()
  
  try {
    const { searchParams } = new URL(req.url)
    const regionCode = searchParams.get('region_code') || 'DE'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYearBerlin()
    
    console.log(`[${requestId}] Fetching holidays for ${regionCode} in year ${year}`)
    
    let holidays
    
    if (isMockMode()) {
      console.log(`[${requestId}] Using mock database for holidays`)
      holidays = await mockDb.getHolidays(regionCode, year)
    } else {
      console.log(`[${requestId}] Using Supabase for holidays`)
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('region_code', regionCode)
        .gte('date', yearStart)
        .lte('date', yearEnd)
        .order('date', { ascending: true })
      
      if (error) {
        console.error(`[${requestId}] Supabase error:`, error)
        return NextResponse.json<ApiResponse>({
          ok: false,
          error: `Failed to fetch holidays: ${error.message}`,
          requestId
        }, { status: 500 })
      }
      
      holidays = data || []
    }
    
    console.log(`[${requestId}] Found ${holidays.length} holidays for ${regionCode} in ${year}`)
    
    return NextResponse.json<ApiResponse>({
      ok: true,
      data: holidays,
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching holidays'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}