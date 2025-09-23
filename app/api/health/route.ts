import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'aboutwater-vacation-dashboard',
    version: '1.0.0'
  })
}