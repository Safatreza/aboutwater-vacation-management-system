import { NextRequest, NextResponse } from 'next/server'
import { testConnection, checkTablesExist, supabase } from '@/lib/supabase'
import { getCurrentYearBerlin } from '@/lib/vacationCalculations'
import { ApiResponse } from '@/types/database'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID()
  
  try {
    console.log(`[${requestId}] AboutWater Health Check initiated`)
    const startTime = Date.now()
    
    // Test database connection with comprehensive checks
    const dbConnectionTest = await testConnection()
    const tableTest = await checkTablesExist()
    
    // Check data counts
    let dataCounts = { employees: 0, vacations: 0, holidays: 0, settings: 0 }
    
    try {
      const [employeeCount, vacationCount, holidayCount, settingsCount] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact' }).then(r => r.data?.length || 0),
        supabase.from('vacations').select('id', { count: 'exact' }).then(r => r.data?.length || 0),
        supabase.from('holidays').select('id', { count: 'exact' }).then(r => r.data?.length || 0),
        supabase.from('settings').select('id', { count: 'exact' }).then(r => r.data?.length || 0)
      ])
      
      dataCounts = {
        employees: employeeCount,
        vacations: vacationCount,
        holidays: holidayCount,
        settings: settingsCount
      }
    } catch (error) {
      console.warn(`[${requestId}] Could not get data counts:`, error instanceof Error ? error.message : 'Unknown error')
    }
    
    // Environment configuration check
    const envCheck = {
      database: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
                   !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                   !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder'),
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'
      },
      googleCalendar: {
        configured: !!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.includes('your-'),
        status: !!process.env.GOOGLE_API_KEY ? 'API key present' : 'Not configured'
      },
      email: {
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.EMAIL_TO),
        status: process.env.EMAIL_TO || 'Not configured'
      }
    }
    
    // Overall health status
    const isHealthy = dbConnectionTest.ok && 
                     tableTest.exists &&
                     dataCounts.employees >= 0 &&
                     dataCounts.holidays >= 0 &&
                     envCheck.database.configured
    
    const healthScore = [
      dbConnectionTest.ok,
      tableTest.exists,
      dataCounts.holidays > 0,
      envCheck.database.configured,
      envCheck.googleCalendar.configured,
      envCheck.email.configured
    ].filter(Boolean).length
    
    const responseTime = Date.now() - startTime
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      score: `${healthScore}/6`,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      currentYear: getCurrentYearBerlin(),
      
      // Database status
      database: {
        connected: dbConnectionTest.ok,
        connectionTime: dbConnectionTest.connectionTime || 0,
        tables: tableTest.tables,
        missingTables: tableTest.missing,
        error: dbConnectionTest.error || null
      },
      
      // Data status
      data: {
        counts: dataCounts,
        hasMinimumData: dataCounts.employees >= 1 && dataCounts.holidays >= 10,
        ready: dataCounts.employees > 0 || dataCounts.holidays > 0
      },
      
      // Services status
      services: envCheck,
      
      // System info
      system: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    }
    
    console.log(`[${requestId}] Health check completed in ${responseTime}ms - Status: ${healthData.status}`)
    
    return NextResponse.json<ApiResponse>({
      ok: true,
      data: healthData,
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown health check error'
    console.error(`[${requestId}] Health check failed:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}