// Dynamic Vacation Calculation System
// Replaces all hardcoded vacation data with real-time calculations

import { parseISO, format, eachDayOfInterval, isWeekend, startOfYear, endOfYear } from 'date-fns'

export interface Employee {
  id: string
  name: string
  allowance_days: number // Editable per employee
  region_code: string
  active: boolean
  color?: string // Assigned color for visual identification
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
  source: string
}

export interface VacationBalance {
  employee_id: string
  employee_name: string
  vacation_allowance: number // From employee.allowance_days
  used_days: number // Calculated from vacation entries
  remaining_days: number // allowance_days - used_days
  employee_region: string
  color?: string // Assigned color for visual identification
}

export class DynamicVacationCalculator {
  private static instance: DynamicVacationCalculator

  public static getInstance(): DynamicVacationCalculator {
    if (!DynamicVacationCalculator.instance) {
      DynamicVacationCalculator.instance = new DynamicVacationCalculator()
    }
    return DynamicVacationCalculator.instance
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
   * NO HARDCODED VALUES - calculated from actual vacation entries
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
   * Calculate dynamic vacation balance for a single employee
   * allowance_days: from database (editable)
   * used_days: calculated from vacation entries
   * remaining_days: allowance - used (auto-calculated)
   */
  calculateEmployeeBalance(
    employee: Employee,
    year: number,
    vacations: Vacation[],
    holidays: Holiday[] = []
  ): VacationBalance {
    const usedDays = this.calculateUsedVacationDays(employee.id, year, vacations, holidays)
    const remainingDays = Math.max(0, employee.allowance_days - usedDays)

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      vacation_allowance: employee.allowance_days, // From database, editable
      used_days: usedDays, // Calculated from actual vacation entries
      remaining_days: remainingDays, // Auto-calculated
      employee_region: employee.region_code,
      color: employee.color // Assigned color for visual identification
    }
  }

  /**
   * Calculate vacation balances for all employees - NO HARDCODED DATA
   */
  calculateAllEmployeeBalances(
    employees: Employee[],
    year: number,
    vacations: Vacation[],
    holidays: Holiday[] = []
  ): VacationBalance[] {
    return employees
      .filter(emp => emp.active)
      .map(employee => this.calculateEmployeeBalance(employee, year, vacations, holidays))
  }

  /**
   * Validate vacation request against current balance
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
    currentUsed: number
    allowance: number
    remainingAfter: number
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

    // Check if this would exceed allowance - DYNAMIC CALCULATION
    const currentUsed = this.calculateUsedVacationDays(employeeId, year, employeeVacations, holidays)
    const totalAfterRequest = currentUsed + workingDays
    const wouldExceedAllowance = totalAfterRequest > employee.allowance_days

    if (wouldExceedAllowance) {
      errors.push(`Request would exceed vacation allowance. Used: ${currentUsed}, Requesting: ${workingDays}, Allowance: ${employee.allowance_days}`)
      isValid = false
    }

    return {
      isValid,
      errors,
      workingDays,
      wouldExceedAllowance,
      currentUsed,
      allowance: employee.allowance_days,
      remainingAfter: Math.max(0, employee.allowance_days - totalAfterRequest)
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

  /**
   * Get summary statistics for all employees
   */
  getVacationSummaryStats(balances: VacationBalance[]): {
    totalEmployees: number
    totalAllowance: number
    totalUsed: number
    totalRemaining: number
    averageUsage: number
  } {
    const totalEmployees = balances.length
    const totalAllowance = balances.reduce((sum, balance) => sum + balance.vacation_allowance, 0)
    const totalUsed = balances.reduce((sum, balance) => sum + balance.used_days, 0)
    const totalRemaining = balances.reduce((sum, balance) => sum + balance.remaining_days, 0)
    const averageUsage = totalEmployees > 0 ? totalUsed / totalEmployees : 0

    return {
      totalEmployees,
      totalAllowance,
      totalUsed,
      totalRemaining,
      averageUsage: Math.round(averageUsage * 10) / 10 // Round to 1 decimal place
    }
  }
}

// Export singleton instance
export const dynamicVacationCalculator = DynamicVacationCalculator.getInstance()

// Utility function for easy access
export function calculateVacationBalance(
  employees: Employee[],
  vacations: Vacation[],
  holidays: Holiday[],
  year: number = new Date().getFullYear()
): VacationBalance[] {
  return dynamicVacationCalculator.calculateAllEmployeeBalances(employees, year, vacations, holidays)
}