import { parseISO, format, eachDayOfInterval, isWeekend, startOfYear, endOfYear } from 'date-fns'
import { Holiday, Vacation, WorkingDayCalculation } from '@/types/database'

const TIMEZONE = 'Europe/Berlin'

export function calculateWorkingDays(
  startDate: string | Date,
  endDate: string | Date,
  holidays: Holiday[] = []
): WorkingDayCalculation {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  
  if (start > end) {
    throw new Error('Start date must be before or equal to end date')
  }

  const allDates = eachDayOfInterval({ start, end })
  const holidayDates = new Set(holidays.map(h => h.date))
  
  let workingDays = 0
  let weekendDays = 0
  let holidayDays = 0
  const excludedDates: string[] = []

  for (const date of allDates) {
    const dateStr = format(date, 'yyyy-MM-dd')
    
    if (isWeekend(date)) {
      weekendDays++
      excludedDates.push(dateStr)
      continue
    }
    
    if (holidayDates.has(dateStr)) {
      holidayDays++
      excludedDates.push(dateStr)
      continue
    }
    
    workingDays++
  }

  return {
    totalDays: allDates.length,
    workingDays,
    weekendDays,
    holidayDays,
    excludedDates
  }
}

export function calculateWorkingDaysCount(
  startDate: string | Date,
  endDate: string | Date,
  holidays: Holiday[] = []
): number {
  return calculateWorkingDays(startDate, endDate, holidays).workingDays
}

export function getHolidaysForYear(holidays: Holiday[], year: number, regionCode: string = 'DE'): Holiday[] {
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

export function calculateUsedVacationDays(
  vacations: Vacation[],
  year: number,
  holidays: Holiday[] = []
): number {
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))

  return vacations.reduce((total, vacation) => {
    const vacationStart = parseISO(vacation.start_date)
    const vacationEnd = parseISO(vacation.end_date)

    if (vacationEnd < yearStart || vacationStart > yearEnd) {
      return total
    }

    const effectiveStart = vacationStart < yearStart ? yearStart : vacationStart
    const effectiveEnd = vacationEnd > yearEnd ? yearEnd : vacationEnd

    const workingDays = calculateWorkingDaysCount(effectiveStart, effectiveEnd, holidays)
    return total + workingDays
  }, 0)
}

/**
 * Checks for vacation overlap
 */
export function checkVacationOverlap(
  startDate: string,
  endDate: string,
  existingVacations: Array<{ start_date: string; end_date: string; id?: string }>,
  excludeId?: string
): { hasOverlap: boolean; conflictingVacation?: { start_date: string; end_date: string } } {
  const newStart = parseISO(startDate)
  const newEnd = parseISO(endDate)

  for (const vacation of existingVacations) {
    if (excludeId && vacation.id === excludeId) {
      continue
    }

    const existingStart = parseISO(vacation.start_date)
    const existingEnd = parseISO(vacation.end_date)

    if (newStart <= existingEnd && newEnd >= existingStart) {
      return {
        hasOverlap: true,
        conflictingVacation: vacation
      }
    }
  }
  
  return { hasOverlap: false }
}

/**
 * Validates vacation dates
 */
export function validateVacationDates(
  startDate: string,
  endDate: string
): { isValid: boolean; error?: string } {
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Invalid date format' }
    }
    
    if (start > end) {
      return { isValid: false, error: 'Start date must be before or equal to end date' }
    }
    
    const now = new Date()
    const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())
    
    if (start > twoYearsFromNow) {
      return { isValid: false, error: 'Vacation dates cannot be more than 2 years in the future' }
    }
    
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: 'Invalid date format' }
  }
}

/**
 * Gets current year in Berlin timezone
 */
export function getCurrentYearBerlin(): number {
  const now = new Date()
  // Simple approximation - for more precision, use date-fns-tz properly
  return now.getFullYear()
}

export function formatDateGerman(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd.MM.yyyy')
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}