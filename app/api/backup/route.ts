import { NextRequest, NextResponse } from 'next/server'
import { BackupService } from '@/lib/backupService'

export async function POST(req: NextRequest) {
  try {
    const backupService = BackupService.getInstance()
    await backupService.performBackup()
    
    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully and sent to safat.majumder@aboutwater.de'
    })
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Backup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const backupService = BackupService.getInstance()
    const nextBackupTime = backupService.getNextBackupTime()
    
    return NextResponse.json({
      success: true,
      nextBackupTime: nextBackupTime.toISOString(),
      nextBackupFormatted: nextBackupTime.toLocaleString('de-DE')
    })
  } catch (error) {
    console.error('Backup status API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to get backup status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}