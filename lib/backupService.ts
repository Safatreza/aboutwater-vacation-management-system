import * as ExcelJS from 'exceljs'
import { emailService, BackupEmailData } from './emailService'

interface Employee {
  id: string
  name: string
  allowance_days: number
  used_days: number
  remaining_days: number
}

interface VacationRecord {
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  days: number
  type: string
  status: string
}

interface BackupData {
  employees: Employee[]
  vacations: VacationRecord[]
  generatedAt: string
}

export class BackupService {
  private static instance: BackupService
  private backupInterval: NodeJS.Timeout | null = null
  private readonly BACKUP_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService()
    }
    return BackupService.instance
  }

  private constructor() {
    this.startAutomaticBackup()
  }

  private async createExcelBackup(data: BackupData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    
    // Employee data sheet
    const employeeSheet = workbook.addWorksheet('Employees')
    employeeSheet.addRow(['Employee ID', 'Name', 'Yearly Allowance', 'Used Days', 'Remaining Days'])
    
    data.employees.forEach(emp => {
      employeeSheet.addRow([emp.id, emp.name, emp.allowance_days, emp.used_days, emp.remaining_days])
    })

    // Format employee sheet headers
    employeeSheet.getRow(1).font = { bold: true }
    employeeSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1c5975' }
    }
    employeeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }

    // Vacation records sheet
    const vacationSheet = workbook.addWorksheet('Vacations')
    vacationSheet.addRow(['Employee ID', 'Employee Name', 'Start Date', 'End Date', 'Days', 'Type', 'Status'])
    
    data.vacations.forEach(vac => {
      vacationSheet.addRow([vac.employeeId, vac.employeeName, vac.startDate, vac.endDate, vac.days, vac.type, vac.status])
    })

    // Format vacation sheet headers
    vacationSheet.getRow(1).font = { bold: true }
    vacationSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1c5975' }
    }
    vacationSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary')
    summarySheet.addRow(['Backup Information'])
    summarySheet.addRow(['Generated At', data.generatedAt])
    summarySheet.addRow(['Total Employees', data.employees.length])
    summarySheet.addRow(['Total Vacation Records', data.vacations.length])
    summarySheet.addRow([''])
    summarySheet.addRow(['aboutwater GmbH - Vacation Management System'])

    // Format summary sheet
    summarySheet.getRow(1).font = { bold: true, size: 16 }
    summarySheet.getRow(6).font = { italic: true }

    // Auto-fit columns
    ;[employeeSheet, vacationSheet, summarySheet].forEach(sheet => {
      sheet.columns.forEach(column => {
        if (column && column.eachCell) {
          let maxLength = 0
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0
            maxLength = Math.max(maxLength, cellLength)
          })
          column.width = Math.min(maxLength + 2, 30)
        }
      })
    })

    return await workbook.xlsx.writeBuffer() as unknown as Buffer
  }

  private async sendBackupEmail(excelBuffer: Buffer, employees: Employee[], vacations: VacationRecord[], holidays: any[]): Promise<void> {
    try {
      const currentDate = new Date().toLocaleDateString('de-DE')
      const fileSizeKB = Math.round(excelBuffer.length / 1024)
      const fileSize = fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`
      
      const emailData: BackupEmailData = {
        recipientEmail: process.env.EMAIL_TO || 'safat.majumder@aboutwater.de',
        backupDate: currentDate,
        employeeCount: employees.length,
        vacationCount: vacations.length,
        holidayCount: holidays.length,
        fileSize: fileSize
      }
      
      const success = await emailService.sendBackupEmail(excelBuffer, emailData)
      
      if (success) {
        console.log('[BackupService] Backup email sent successfully')
      } else {
        console.log('[BackupService] Failed to send backup email - check configuration')
      }
    } catch (error) {
      console.error('[BackupService] Error sending backup email:', error)
    }
  }

  private async getRealData(): Promise<BackupData> {
    try {
      // Fetch real employee data from API
      const employeesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/employees`)
      const employeesResult = await employeesResponse.json()
      
      let employees: Employee[] = []
      let vacations: VacationRecord[] = []
      
      if (employeesResult.ok && employeesResult.data) {
        employees = employeesResult.data.map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          allowance_days: emp.allowance_days || 25,
          used_days: emp.used_days || 0,
          remaining_days: emp.remaining_days || emp.allowance_days || 25
        }))
        
        // Fetch vacation data for all employees
        const vacationPromises = employees.map(async (emp) => {
          try {
            const vacationsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vacations?employee_id=${emp.id}`)
            const vacationsResult = await vacationsResponse.json()
            
            if (vacationsResult.ok && vacationsResult.data) {
              return vacationsResult.data.map((vac: any) => ({
                employeeId: emp.id,
                employeeName: emp.name,
                startDate: vac.start_date,
                endDate: vac.end_date,
                days: vac.days || this.calculateDays(vac.start_date, vac.end_date),
                type: vac.type || 'Annual Leave',
                status: vac.status || 'Approved'
              }))
            }
          } catch (error) {
            console.warn(`Failed to fetch vacations for employee ${emp.name}:`, error)
          }
          return []
        })
        
        const allVacations = await Promise.all(vacationPromises)
        vacations = allVacations.flat()
      }
      
      // If no real data found, return empty data
      if (employees.length === 0) {
        console.log('[BackupService] No employees found, creating empty backup')
      }
      
      return {
        employees,
        vacations,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('[BackupService] Failed to fetch real data, creating empty backup:', error)
      return {
        employees: [],
        vacations: [],
        generatedAt: new Date().toISOString()
      }
    }
  }
  
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  public async performBackup(): Promise<void> {
    try {
      console.log('[BackupService] Starting backup process...')
      
      const backupData = await this.getRealData()
      console.log(`[BackupService] Collected data: ${backupData.employees.length} employees, ${backupData.vacations.length} vacations`)
      
      const excelBuffer = await this.createExcelBackup(backupData)
      console.log(`[BackupService] Excel file created (${Math.round(excelBuffer.length / 1024)} KB)`)
      
      await this.sendBackupEmail(excelBuffer, backupData.employees, backupData.vacations, [])
      
      console.log('[BackupService] Backup completed successfully')
    } catch (error) {
      console.error('[BackupService] Backup failed:', error)
      throw error // Re-throw for API error handling
    }
  }

  public startAutomaticBackup(): void {
    // Clear any existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
    }

    // Set up automatic backup every 7 days
    this.backupInterval = setInterval(() => {
      this.performBackup()
    }, this.BACKUP_INTERVAL)

    console.log('Automatic backup system started - backups will occur every 7 days')
    
    // Perform initial backup after 1 minute for testing (remove in production)
    setTimeout(() => {
      console.log('Performing initial backup for testing...')
      this.performBackup()
    }, 60000) // 1 minute
  }

  public stopAutomaticBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval)
      this.backupInterval = null
      console.log('Automatic backup system stopped')
    }
  }

  public getNextBackupTime(): Date {
    // This would typically be stored in a database or file
    // For now, we'll calculate based on the current time + 7 days
    return new Date(Date.now() + this.BACKUP_INTERVAL)
  }
}

// Initialize the backup service when the module is loaded
if (typeof window === 'undefined') { // Only on server side
  BackupService.getInstance()
}