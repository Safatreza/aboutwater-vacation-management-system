import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ApiResponse, Vacation } from '@/types/database'

// DELETE /api/vacations/[id] - Delete vacation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const requestId = crypto.randomUUID()
  const vacationId = params.id
  
  try {
    console.log(`[${requestId}] Deleting vacation with ID: ${vacationId}`)
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(vacationId)) {
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Invalid vacation ID format',
        requestId
      }, { status: 400 })
    }
    
    // Check if vacation exists and get details for logging
    const { data: existingVacation, error: fetchError } = await supabase
      .from('vacations')
      .select(`
        *,
        employees:employee_id (
          name
        )
      `)
      .eq('id', vacationId)
      .single()
    
    if (fetchError || !existingVacation) {
      console.error(`[${requestId}] Vacation not found:`, fetchError?.message)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Vacation not found',
        requestId
      }, { status: 404 })
    }
    
    // Delete the vacation
    const { error: deleteError } = await supabase
      .from('vacations')
      .delete()
      .eq('id', vacationId)
    
    if (deleteError) {
      console.error(`[${requestId}] Error deleting vacation:`, deleteError.message)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: `Failed to delete vacation: ${deleteError.message}`,
        requestId
      }, { status: 500 })
    }
    
    console.log(`[${requestId}] Successfully deleted vacation for ${(existingVacation as any).employees?.name} from ${(existingVacation as any).start_date} to ${(existingVacation as any).end_date}`)
    
    return NextResponse.json<ApiResponse>({
      ok: true,
      data: { 
        message: 'Vacation deleted successfully',
        deleted_vacation: {
          start_date: (existingVacation as any).start_date,
          end_date: (existingVacation as any).end_date,
          working_days: (existingVacation as any).working_days
        }
      },
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error deleting vacation'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}

// GET /api/vacations/[id] - Get specific vacation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Vacation>>> {
  const requestId = crypto.randomUUID()
  const vacationId = params.id
  
  try {
    console.log(`[${requestId}] Fetching vacation with ID: ${vacationId}`)
    
    const { data: vacation, error } = await supabase
      .from('vacations')
      .select(`
        *,
        employees:employee_id (
          id,
          name,
          region_code
        )
      `)
      .eq('id', vacationId)
      .single()
    
    if (error || !vacation) {
      console.error(`[${requestId}] Vacation not found:`, error?.message)
      return NextResponse.json<ApiResponse>({
        ok: false,
        error: 'Vacation not found',
        requestId
      }, { status: 404 })
    }
    
    console.log(`[${requestId}] Successfully fetched vacation from ${(vacation as any).start_date} to ${(vacation as any).end_date}`)
    
    return NextResponse.json<ApiResponse<Vacation>>({
      ok: true,
      data: vacation,
      requestId
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching vacation'
    console.error(`[${requestId}] Error:`, errorMessage)
    
    return NextResponse.json<ApiResponse>({
      ok: false,
      error: errorMessage,
      requestId
    }, { status: 500 })
  }
}