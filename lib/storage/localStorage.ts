// SUPABASE STORAGE REPLACEMENT
// This file now redirects to Supabase operations instead of localStorage

import { employees, vacations, holidays } from '../supabaseStorage'
import type { Employee as DBEmployee, Vacation as DBVacation, Holiday as DBHoliday } from '@/types/database'

// Keep original interfaces for backward compatibility
export interface Employee extends DBEmployee {}
export interface Vacation extends DBVacation {}
export interface Holiday extends DBHoliday {}

// Storage keys (kept for backward compatibility)
const EMPLOYEES_KEY = 'aboutwater_employees'
const VACATIONS_KEY = 'aboutwater_vacations'
const HOLIDAYS_KEY = 'aboutwater_holidays'

// Helper functions for localStorage fallback
const generateId = () => Math.random().toString(36).substring(2, 15)

const getFromStorage = <T>(key: string, defaultValue: T[] = []): T[] => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Employee operations - now using Supabase
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    // Try Supabase first
    const supabaseEmployees = await employees.getAll()
    if (supabaseEmployees.length > 0) {
      return supabaseEmployees
    }

    // Fallback to localStorage
    return getFromStorage<Employee>(EMPLOYEES_KEY)
  } catch (error) {
    console.error('❌ Failed to get employees from Supabase, using localStorage:', error)
    return getFromStorage<Employee>(EMPLOYEES_KEY)
  }
}

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> => {
  try {
    // Try Supabase first
    const newEmployee = await employees.create({
      name: employee.name,
      allowance_days: employee.allowance_days,
      region_code: employee.region_code,
      active: employee.active !== false,
      // Convert any additional fields
      ...(employee as any)
    })
    return newEmployee
  } catch (error) {
    console.error('❌ Failed to create employee in Supabase, using localStorage:', error)

    // Fallback to localStorage
    const localEmployees = getFromStorage<Employee>(EMPLOYEES_KEY)
    const newEmployee: Employee = {
      ...employee,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Employee
    localEmployees.push(newEmployee)
    saveToStorage(EMPLOYEES_KEY, localEmployees)
    return newEmployee
  }
}

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  try {
    // Try Supabase first
    const updatedEmployee = await employees.update(id, updates)
    return updatedEmployee
  } catch (error) {
    console.error('❌ Failed to update employee in Supabase, using localStorage:', error)

    // Fallback to localStorage
    const localEmployees = getFromStorage<Employee>(EMPLOYEES_KEY)
    const index = localEmployees.findIndex(emp => emp.id === id)
    if (index === -1) throw new Error('Employee not found')

    localEmployees[index] = { ...localEmployees[index], ...updates }
    saveToStorage(EMPLOYEES_KEY, localEmployees)
    return localEmployees[index]
  }
}

// Vacation operations - now using Supabase
export const getVacations = async (employeeId?: string, year?: number): Promise<Vacation[]> => {
  try {
    // Try Supabase first
    let supabaseVacations: Vacation[]

    if (employeeId) {
      supabaseVacations = await vacations.getByEmployee(employeeId)
    } else if (year) {
      supabaseVacations = await vacations.getByYear(year)
    } else {
      supabaseVacations = await vacations.getAll()
    }

    if (supabaseVacations.length > 0) {
      return supabaseVacations.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
    }

    // Fallback to localStorage
    let localVacations = getFromStorage<Vacation>(VACATIONS_KEY)

    if (employeeId) {
      localVacations = localVacations.filter(v => v.employee_id === employeeId)
    }

    if (year) {
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      localVacations = localVacations.filter(v => v.start_date >= yearStart && v.end_date <= yearEnd)
    }

    return localVacations.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  } catch (error) {
    console.error('❌ Failed to get vacations from Supabase, using localStorage:', error)

    // Final fallback to localStorage
    let localVacations = getFromStorage<Vacation>(VACATIONS_KEY)

    if (employeeId) {
      localVacations = localVacations.filter(v => v.employee_id === employeeId)
    }

    if (year) {
      const yearStart = `${year}-01-01`
      const yearEnd = `${year}-12-31`
      localVacations = localVacations.filter(v => v.start_date >= yearStart && v.end_date <= yearEnd)
    }

    return localVacations.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
  }
}

export const createVacation = async (vacation: Omit<Vacation, 'id' | 'created_at'>): Promise<Vacation> => {
  try {
    // Try Supabase first
    const newVacation = await vacations.create({
      employee_id: vacation.employee_id,
      start_date: vacation.start_date,
      end_date: vacation.end_date,
      working_days: (vacation as any).working_days || 1, // Convert from old format
      note: vacation.note
    })
    return newVacation
  } catch (error) {
    console.error('❌ Failed to create vacation in Supabase, using localStorage:', error)

    // Fallback to localStorage
    const localVacations = getFromStorage<Vacation>(VACATIONS_KEY)
    const newVacation: Vacation = {
      ...vacation,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      working_days: (vacation as any).working_days || 1
    } as Vacation
    localVacations.push(newVacation)
    saveToStorage(VACATIONS_KEY, localVacations)
    return newVacation
  }
}

export const deleteVacation = async (id: string): Promise<void> => {
  try {
    // Try Supabase first
    await vacations.delete(id)
  } catch (error) {
    console.error('❌ Failed to delete vacation in Supabase, using localStorage:', error)

    // Fallback to localStorage
    const localVacations = getFromStorage<Vacation>(VACATIONS_KEY)
    const filtered = localVacations.filter(v => v.id !== id)
    saveToStorage(VACATIONS_KEY, filtered)
  }
}

// Holiday operations - now using Supabase
export const getHolidays = async (regionCode: string = 'DE-BY'): Promise<Holiday[]> => {
  try {
    // Try Supabase first
    const currentYear = new Date().getFullYear()
    const supabaseHolidays = await holidays.getByRegionAndYear(regionCode, currentYear)

    if (supabaseHolidays.length > 0) {
      return supabaseHolidays.sort((a, b) => a.date.localeCompare(b.date))
    }

    // Fallback to localStorage
    const localHolidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
    return localHolidays.filter(h => h.region_code === regionCode).sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('❌ Failed to get holidays from Supabase, using localStorage:', error)

    // Final fallback to localStorage
    const localHolidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
    return localHolidays.filter(h => h.region_code === regionCode).sort((a, b) => a.date.localeCompare(b.date))
  }
}

export const createHoliday = async (holiday: Omit<Holiday, 'id' | 'created_at'>): Promise<Holiday> => {
  try {
    // Try Supabase first
    const [newHoliday] = await holidays.bulkInsert([{
      region_code: holiday.region_code,
      date: holiday.date,
      name: holiday.name,
      source: holiday.source || 'manual'
    }])
    return newHoliday
  } catch (error) {
    console.error('❌ Failed to create holiday in Supabase, using localStorage:', error)

    // Fallback to localStorage
    const localHolidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
    const newHoliday: Holiday = {
      ...holiday,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Holiday
    localHolidays.push(newHoliday)
    saveToStorage(HOLIDAYS_KEY, localHolidays)
    return newHoliday
  }
}

export const bulkInsertHolidays = async (holidayList: Omit<Holiday, 'id' | 'created_at'>[]): Promise<void> => {
  try {
    // Try Supabase first
    await holidays.bulkInsert(holidayList.map(holiday => ({
      region_code: holiday.region_code,
      date: holiday.date,
      name: holiday.name,
      source: holiday.source || 'google_calendar'
    })))

    console.log(`✅ Bulk inserted ${holidayList.length} holidays to Supabase`)
  } catch (error) {
    console.error('❌ Failed to bulk insert holidays to Supabase, using localStorage:', error)

    // Fallback to localStorage
    const existingHolidays = getFromStorage<Holiday>(HOLIDAYS_KEY)

    holidayList.forEach(holiday => {
      // Check if holiday already exists (same region and date)
      const exists = existingHolidays.some(
        h => h.region_code === holiday.region_code && h.date === holiday.date
      )

      if (!exists) {
        const newHoliday: Holiday = {
          ...holiday,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Holiday
        existingHolidays.push(newHoliday)
      }
    })

    saveToStorage(HOLIDAYS_KEY, existingHolidays)
    console.log(`📱 Bulk inserted ${holidayList.length} holidays to localStorage as fallback`)
  }
}

export const deleteHoliday = async (id: string): Promise<void> => {
  // Note: Supabase holidays don't typically get deleted, but we support localStorage cleanup
  const localHolidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
  const filtered = localHolidays.filter(h => h.id !== id)
  saveToStorage(HOLIDAYS_KEY, filtered)
}

// Migration helper - check if data exists in localStorage
export function hasLocalStorageData(): {
  employees: boolean
  vacations: boolean
  holidays: boolean
} {
  if (typeof window === 'undefined') {
    return { employees: false, vacations: false, holidays: false }
  }

  return {
    employees: Boolean(localStorage.getItem(EMPLOYEES_KEY)),
    vacations: Boolean(localStorage.getItem(VACATIONS_KEY)),
    holidays: Boolean(localStorage.getItem(HOLIDAYS_KEY))
  }
}

// Clean up localStorage after successful migration
export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return

  const keysToClean = [EMPLOYEES_KEY, VACATIONS_KEY, HOLIDAYS_KEY]
  keysToClean.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to clear localStorage key ${key}:`, error)
    }
  })

  console.log('🧹 Cleared localStorage after Supabase migration')
}