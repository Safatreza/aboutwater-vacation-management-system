// Workbook Parity System - Exact Excel behavior replication for 2025
// Fixed year: 2025 (365 days from 2025-01-01 to 2025-12-31)
// Code-driven counting only - visual flags don't affect totals

// ================================
// CANONICAL DATA MODEL
// ================================

export interface HolidayRange {
  id: string
  name: string              // Bezeichnung
  start_date: string        // Von (inclusive) - YYYY-MM-DD
  end_date: string          // Bis (inclusive) - YYYY-MM-DD
  category: 'Ferien' | 'Feiertag' | 'Betriebsschließung'
}

export interface LeaveCode {
  code: string              // "U","U2","G","G2","S","UU"
  description: string       // from Konfig
  value_vacation: number    // Urlaubstage
  value_comp: number        // Gleittage
  value_special: number     // Sondertage
}

export interface Employee {
  id: string
  name: string                      // Column A
  carryover_prev_year: number      // Column B - manual input from prior year
  allowance_current_year: number   // Column C - manual input
  active: boolean
}

// ================================
// DERIVED OBJECTS
// ================================

export interface VacationEntry {
  employee_id: string
  employee_name: string
  date: string              // YYYY-MM-DD
  code: string
  category: 'vacation' | 'comp' | 'special' | 'unknown'
  value: number             // from LeaveCode mapping for that code/day
}

export interface EmployeeRange {
  employee_id: string
  employee_name: string
  start_date: string        // YYYY-MM-DD
  end_date: string          // YYYY-MM-DD
  code: string
  reason: string            // from LeaveCode.description
  category: 'vacation' | 'comp' | 'special' | 'unknown'
  value_per_day: number
  total_value: number       // value_per_day * number_of_days_in_range
}

export interface EmployeeReport {
  employee_id: string
  name: string
  carryover_prev_year: number      // B
  allowance_current_year: number   // C
  used_vacation: number            // Σ LeaveCode.value_vacation
  comp_days: number                // Σ LeaveCode.value_comp
  special_days: number             // Σ LeaveCode.value_special
  remaining_vacation: number       // B + C − used_vacation
  ranges: EmployeeRange[]          // compressed from daily codes
  entries?: VacationEntry[]        // optional per-day expansion
  color?: string                   // Assigned color for visual identification
}

// ================================
// CANONICAL LEAVE CODE MAPPING
// ================================

export const CANONICAL_LEAVE_CODES: LeaveCode[] = [
  { code: 'U',  description: 'Urlaub (ganzer Tag)',           value_vacation: 1.0, value_comp: 0,   value_special: 0   },
  { code: 'U2', description: 'Urlaub (halber Tag)',          value_vacation: 0.5, value_comp: 0,   value_special: 0   },
  { code: 'G',  description: 'Gleittag (ganzer Tag)',        value_vacation: 0,   value_comp: 1.0, value_special: 0   },
  { code: 'G2', description: 'Gleittag (halber Tag)',        value_vacation: 0,   value_comp: 0.5, value_special: 0   },
  { code: 'S',  description: 'Sonderurlaub',                 value_vacation: 0,   value_comp: 0,   value_special: 1.0 },
  { code: 'UU', description: 'Urlaub unbezahlt',             value_vacation: 0,   value_comp: 0,   value_special: 1.0 },
  { code: 'Ü',  description: 'Überstundenabbau',             value_vacation: 0,   value_comp: 1.0, value_special: 0   }
]

// ================================
// WORKBOOK PARITY ENGINE
// ================================

export class WorkbookParityEngine {
  private static instance: WorkbookParityEngine
  private dateArray: string[] = []          // D[0..364] - 2025-01-01 to 2025-12-31
  private weekdayArray: number[] = []       // Mon=1 … Sun=7
  private leaveCodeMap: Map<string, LeaveCode> = new Map()
  private holidayFlags: boolean[][] = []   // [flagType][dayIndex] - visual only

  public static getInstance(): WorkbookParityEngine {
    if (!WorkbookParityEngine.instance) {
      WorkbookParityEngine.instance = new WorkbookParityEngine()
    }
    return WorkbookParityEngine.instance
  }

  constructor() {
    this.initializeDateArray()
    this.initializeLeaveCodeMap()
    this.initializeHolidayFlags()
  }

  // ================================
  // A) BUILD DATE ARRAY (2025)
  // ================================

  private initializeDateArray(): void {
    const startDate = new Date('2025-01-01')

    for (let i = 0; i < 365; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)

      this.dateArray[i] = this.formatDate(currentDate)
      this.weekdayArray[i] = this.getWeekdayNumber(currentDate)
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0] // YYYY-MM-DD
  }

  private getWeekdayNumber(date: Date): number {
    // Convert JS weekday (0=Sunday) to ISO weekday (1=Monday, 7=Sunday)
    const jsDay = date.getDay()
    return jsDay === 0 ? 7 : jsDay
  }

  // ================================
  // LEAVE CODE MAPPING
  // ================================

  private initializeLeaveCodeMap(): void {
    CANONICAL_LEAVE_CODES.forEach(code => {
      this.leaveCodeMap.set(code.code, code)
    })
  }

  public getLeaveCode(code: string): LeaveCode {
    return this.leaveCodeMap.get(code) || {
      code,
      description: 'Unknown Code',
      value_vacation: 0,
      value_comp: 0,
      value_special: 0
    }
  }

  public addLeaveCode(leaveCode: LeaveCode): void {
    this.leaveCodeMap.set(leaveCode.code, leaveCode)
  }

  // ================================
  // B) FLAGS FROM HOLIDAYS (VISUAL ONLY)
  // ================================

  private initializeHolidayFlags(): void {
    // Initialize 3 flag types x 365 days
    this.holidayFlags = [
      new Array(365).fill(false), // Ferien
      new Array(365).fill(false), // Feiertag
      new Array(365).fill(false)  // Betriebsschließung
    ]
  }

  public setHolidayFlags(holidays: HolidayRange[]): void {
    this.initializeHolidayFlags()

    holidays.forEach(holiday => {
      const startIdx = this.getDateIndex(holiday.start_date)
      const endIdx = this.getDateIndex(holiday.end_date)

      if (startIdx === -1 || endIdx === -1) return

      const flagType = holiday.category === 'Ferien' ? 0 :
                      holiday.category === 'Feiertag' ? 1 : 2

      for (let i = startIdx; i <= endIdx; i++) {
        this.holidayFlags[flagType][i] = true
      }
    })
  }

  private getDateIndex(dateStr: string): number {
    return this.dateArray.indexOf(dateStr)
  }

  public getDateFlags(dateIndex: number): {
    isFerien: boolean
    isFeiertag: boolean
    isBetriebsschliessung: boolean
  } {
    if (dateIndex < 0 || dateIndex >= 365) {
      return { isFerien: false, isFeiertag: false, isBetriebsschliessung: false }
    }

    return {
      isFerien: this.holidayFlags[0][dateIndex],
      isFeiertag: this.holidayFlags[1][dateIndex],
      isBetriebsschliessung: this.holidayFlags[2][dateIndex]
    }
  }

  // ================================
  // C) TOTALS PER EMPLOYEE
  // ================================

  public calculateEmployeeReport(
    employee: Employee,
    dailyCodes: string[]  // 365 codes, one per day
  ): EmployeeReport {
    let used_vacation = 0
    let comp_days = 0
    let special_days = 0
    const entries: VacationEntry[] = []

    // Sum up all codes for the year
    dailyCodes.forEach((code, dayIndex) => {
      if (!code || code.trim() === '') return

      const leaveCode = this.getLeaveCode(code.trim())

      used_vacation += leaveCode.value_vacation
      comp_days += leaveCode.value_comp
      special_days += leaveCode.value_special

      // Create entry for this day
      entries.push({
        employee_id: employee.id,
        employee_name: employee.name,
        date: this.dateArray[dayIndex],
        code: code.trim(),
        category: this.categorizeLeaveCode(leaveCode),
        value: this.getLeaveCodeValue(leaveCode, this.categorizeLeaveCode(leaveCode))
      })
    })

    const remaining_vacation = employee.carryover_prev_year + employee.allowance_current_year - used_vacation

    return {
      employee_id: employee.id,
      name: employee.name,
      carryover_prev_year: employee.carryover_prev_year,
      allowance_current_year: employee.allowance_current_year,
      used_vacation,
      comp_days,
      special_days,
      remaining_vacation,
      ranges: this.extractRanges(employee, dailyCodes),
      entries
    }
  }

  private categorizeLeaveCode(leaveCode: LeaveCode): 'vacation' | 'comp' | 'special' | 'unknown' {
    if (leaveCode.value_vacation > 0) return 'vacation'
    if (leaveCode.value_comp > 0) return 'comp'
    if (leaveCode.value_special > 0) return 'special'
    return 'unknown'
  }

  private getLeaveCodeValue(leaveCode: LeaveCode, category: string): number {
    switch (category) {
      case 'vacation': return leaveCode.value_vacation
      case 'comp': return leaveCode.value_comp
      case 'special': return leaveCode.value_special
      default: return 0
    }
  }

  // ================================
  // D) RANGE EXTRACTION
  // ================================

  public extractRanges(employee: Employee, dailyCodes: string[]): EmployeeRange[] {
    const ranges: EmployeeRange[] = []
    let i = 0

    while (i < 365) {
      // Skip empty days
      if (!dailyCodes[i] || dailyCodes[i].trim() === '') {
        i++
        continue
      }

      const startIdx = i
      const code = dailyCodes[i].trim()

      // Find end of consecutive identical codes
      while (i < 365 && dailyCodes[i] && dailyCodes[i].trim() === code) {
        i++
      }
      const endIdx = i - 1

      // Create range
      const leaveCode = this.getLeaveCode(code)
      const category = this.categorizeLeaveCode(leaveCode)
      const value_per_day = this.getLeaveCodeValue(leaveCode, category)
      const total_days = endIdx - startIdx + 1
      const total_value = value_per_day * total_days

      ranges.push({
        employee_id: employee.id,
        employee_name: employee.name,
        start_date: this.dateArray[startIdx],
        end_date: this.dateArray[endIdx],
        code,
        reason: leaveCode.description,
        category,
        value_per_day,
        total_value
      })
    }

    return ranges
  }

  // ================================
  // UTILITY METHODS
  // ================================

  public getDateArray(): string[] {
    return [...this.dateArray]
  }

  public getWeekdayArray(): number[] {
    return [...this.weekdayArray]
  }

  public getDateByIndex(index: number): string | null {
    return this.dateArray[index] || null
  }

  public getIndexByDate(dateStr: string): number {
    return this.getDateIndex(dateStr)
  }

  public isWeekend(dateIndex: number): boolean {
    const weekday = this.weekdayArray[dateIndex]
    return weekday === 6 || weekday === 7 // Saturday or Sunday
  }
}

// Export singleton instance
export const workbookParityEngine = WorkbookParityEngine.getInstance()