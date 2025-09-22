// DELETED - This route has been removed to eliminate redundant API endpoints
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'This endpoint has been removed' }, { status: 404 })
}