// Dynamic Vacation Calculation Service
// Real-time calculation of used and remaining vacation days

import { parseISO, format, eachDayOfInterval, isWeekend, startOfYear, endOfYear } from 'date-fns'

export interface Employee {
  id: string
  name: string
  allowance_days: number // Editable per employee
  region_code: string
  active: boolean
}

export interface Vacation {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  working_days: number
  note?: string
}

export interface Holiday {
  id: string
  date: string
  name: string
  region_code: string
  source: 'google' | 'company'
}

export interface EmployeeVacationSummary {
  employee_id: string
  employee_name: string
  vacation_allowance: number // From employee.allowance_days
  used_days: number // Calculated from vacation entries
  remaining_days: number // allowance_days - used_days
  employee_region: string
}

export class VacationCalculationService {
  private static instance: VacationCalculationService

  public static getInstance(): VacationCalculationService {
    if (!VacationCalculationService.instance) {
      VacationCalculationService.instance = new VacationCalculationService()
    }
    return VacationCalculationService.instance
  }

  /**
   * Calculate working days between two dates, excluding weekends and holidays
   */
  calculateWorkingDays(
    startDate: string | Date,
    endDate: string | Date,
    holidays: Holiday[] = []
  ): number {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate

    if (start > end) {
      throw new Error('Start date must be before or equal to end date')
    }

    const allDates = eachDayOfInterval({ start, end })
    const holidayDates = new Set(holidays.map(h => h.date))

    let workingDays = 0

    for (const date of allDates) {
      const dateStr = format(date, 'yyyy-MM-dd')

      // Skip weekends
      if (isWeekend(date)) {
        continue
      }

      // Skip holidays
      if (holidayDates.has(dateStr)) {
        continue
      }

      workingDays++
    }

    return workingDays
  }

  /**
   * Calculate total used vacation days for an employee in a specific year
   */
  calculateUsedVacationDays(
    employeeId: string,
    year: number,
    vacations: Vacation[],
    holidays: Holiday[] = []
  ): number {
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(new Date(year, 0, 1))

    // Filter vacations for this employee and year
    const employeeVacations = vacations.filter(vacation => {
      if (vacation.employee_id !== employeeId) return false

      const vacationStart = parseISO(vacation.start_date)
      const vacationEnd = parseISO(vacation.end_date)

      // Check if vacation overlaps with the year
      return vacationEnd >= yearStart && vacationStart <= yearEnd
    })

    let totalUsedDays = 0

    for (const vacation of employeeVacations) {
      const vacationStart = parseISO(vacation.start_date)
      const vacationEnd = parseISO(vacation.end_date)

      // Calculate effective dates within the year
      const effectiveStart = vacationStart < yearStart ? yearStart : vacationStart
      const effectiveEnd = vacationEnd > yearEnd ? yearEnd : vacationEnd

      // Calculate working days for this vacation period
      const workingDays = this.calculateWorkingDays(effectiveStart, effectiveEnd, holidays)
      totalUsedDays += workingDays
    }

    return totalUsedDays
  }

  /**
   * Calculate vacation summary for a single employee
   */
  calculateEmployeeSummary(
    employee: Employee,
    year: number,
    vacations: Vacation[],
    holidays: Holiday[] = []
  ): EmployeeVacationSummary {
    const usedDays = this.calculateUsedVacationDays(employee.id, year, vacations, holidays)
    const remainingDays = Math.max(0, employee.allowance_days - usedDays)

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      vacation_allowance: employee.allowance_days,
      used_days: usedDays,
      remaining_days: remainingDays,
      employee_region: employee.region_code
    }
  }

  /**
   * Calculate vacation summaries for all employees
   */
  calculateAllEmployeeSummaries(
    employees: Employee[],
    year: number,
    vacations: Vacation[],
    holidays: Holiday[] = []
  ): EmployeeVacationSummary[] {
    return employees
      .filter(emp => emp.active)
      .map(employee => this.calculateEmployeeSummary(employee, year, vacations, holidays))
  }

  /**
   * Validate if a vacation period is valid (no overlaps, sufficient days)
   */
  validateVacationRequest(
    employeeId: string,
    startDate: string,
    endDate: string,
    employee: Employee,
    existingVacations: Vacation[],
    holidays: Holiday[] = [],
    year: number = new Date().getFullYear(),
    excludeVacationId?: string
  ): {
    isValid: boolean
    errors: string[]
    workingDays: number
    wouldExceedAllowance: boolean
  } {
    const errors: string[] = []
    let isValid = true

    // Calculate working days for the requested period
    const workingDays = this.calculateWorkingDays(startDate, endDate, holidays)

    // Check for overlaps with existing vacations
    const employeeVacations = existingVacations.filter(v =>
      v.employee_id === employeeId &&
      (!excludeVacationId || v.id !== excludeVacationId)
    )

    for (const vacation of employeeVacations) {
      if (this.datesOverlap(startDate, endDate, vacation.start_date, vacation.end_date)) {
        errors.push(`Vacation period overlaps with existing vacation from ${vacation.start_date} to ${vacation.end_date}`)
        isValid = false
      }
    }

    // Check if this would exceed allowance
    const currentUsedDays = this.calculateUsedVacationDays(employeeId, year, employeeVacations, holidays)
    const totalAfterRequest = currentUsedDays + workingDays
    const wouldExceedAllowance = totalAfterRequest > employee.allowance_days

    if (wouldExceedAllowance) {
      errors.push(`Request would exceed vacation allowance. Used: ${currentUsedDays}, Requesting: ${workingDays}, Allowance: ${employee.allowance_days}`)
      isValid = false
    }

    return {
      isValid,
      errors,
      workingDays,
      wouldExceedAllowance
    }
  }

  /**
   * Check if two date ranges overlap
   */
  private datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = parseISO(start1)
    const e1 = parseISO(end1)
    const s2 = parseISO(start2)
    const e2 = parseISO(end2)

    return s1 <= e2 && s2 <= e1
  }

  /**
   * Get holidays for a specific year and region
   */
  getHolidaysForYear(holidays: Holiday[], year: number, regionCode: string = 'DE'): Holiday[] {
    const yearStart = startOfYear(new Date(year, 0, 1))
    const yearEnd = endOfYear(new Date(year, 0, 1))

    return holidays.filter(holiday => {
      const holidayDate = parseISO(holiday.date)
      return (
        holiday.region_code === regionCode &&
        holidayDate >= yearStart &&
        holidayDate <= yearEnd
      )
    })
  }

  /**
   * Update vacation working days based on actual calculation
   */
  updateVacationWorkingDays(
    vacation: Vacation,
    holidays: Holiday[] = []
  ): Vacation {
    const workingDays = this.calculateWorkingDays(
      vacation.start_date,
      vacation.end_date,
      holidays
    )

    return {
      ...vacation,
      working_days: workingDays
    }
  }
}

// Export singleton instance
export const vacationCalculationService = VacationCalculationService.getInstance()