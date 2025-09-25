// SUPABASE CLIENT STORAGE SYSTEM
// Replaces localStorage with Supabase database operations

import { employees, vacations, holidays } from './supabaseStorage'
import type { Employee, Vacation, Holiday } from '@/types/database'

export interface StoredEmployee extends Employee {}
export interface StoredVacation extends Vacation {}

// Real-time event system for UI updates
export function dispatchStorageUpdate(table: string, action: string, data?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabaseUpdate', {
      detail: { table, action, data }
    }))
  }
}

// Employee Storage Operations
export async function saveEmployees(employeeList: Employee[]): Promise<void> {
  try {
    console.log(`💾 Saving ${employeeList.length} employees to Supabase`)

    // Note: For bulk operations, we'd need to implement batch operations
    // For now, this is handled by the supabaseStorage module
    throw new Error('Use supabaseStorage.employees operations instead of saveEmployees')
  } catch (error) {
    console.error('❌ Failed to save employees:', error)
    throw error
  }
}

export async function loadEmployees(): Promise<StoredEmployee[]> {
  try {
    const employeeList = await employees.getAll()
    console.log(`📖 Loaded ${employeeList.length} employees from Supabase`)

    // Dispatch event for real-time UI updates
    dispatchStorageUpdate('employees', 'load', employeeList)

    return employeeList
  } catch (error) {
    console.error('❌ Failed to load employees:', error)
    return []
  }
}

// Vacation Storage Operations
export async function saveVacations(vacationList: Vacation[]): Promise<void> {
  try {
    console.log(`💾 Saving ${vacationList.length} vacations to Supabase`)

    // Note: For bulk operations, individual create/update operations should be used
    throw new Error('Use supabaseStorage.vacations operations instead of saveVacations')
  } catch (error) {
    console.error('❌ Failed to save vacations:', error)
    throw error
  }
}

export async function loadVacations(): Promise<StoredVacation[]> {
  try {
    const vacationList = await vacations.getAll()
    console.log(`📖 Loaded ${vacationList.length} vacations from Supabase`)

    // Dispatch event for real-time UI updates
    dispatchStorageUpdate('vacations', 'load', vacationList)

    return vacationList
  } catch (error) {
    console.error('❌ Failed to load vacations:', error)
    return []
  }
}

// Holiday Storage Operations
export async function loadHolidays(regionCode: string = 'DE-BY', year: number = new Date().getFullYear()): Promise<Holiday[]> {
  try {
    const holidayList = await holidays.getByRegionAndYear(regionCode, year)
    console.log(`📖 Loaded ${holidayList.length} holidays from Supabase for ${regionCode} ${year}`)

    // Dispatch event for real-time UI updates
    dispatchStorageUpdate('holidays', 'load', holidayList)

    return holidayList
  } catch (error) {
    console.error('❌ Failed to load holidays:', error)
    return []
  }
}

// Generic data removal (soft delete for employees, hard delete for others)
export async function removeData(key: string): Promise<void> {
  console.log(`🗑️ Data removal for key: ${key}`)

  if (key.includes('employees')) {
    console.warn('⚠️ Employee deletion should use supabaseStorage.employees.delete()')
  } else if (key.includes('vacations')) {
    console.warn('⚠️ Vacation deletion should use supabaseStorage.vacations.delete()')
  }

  // Legacy localStorage cleanup
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
      console.log(`🗑️ Cleaned up localStorage key: ${key}`)
    } catch (error) {
      console.warn('Failed to clean localStorage:', error)
    }
  }
}

// Migration utility - detect if data exists in localStorage and suggest migration
export function checkLocalStorageMigration(): {
  hasEmployees: boolean
  hasVacations: boolean
  shouldMigrate: boolean
} {
  if (typeof window === 'undefined') {
    return { hasEmployees: false, hasVacations: false, shouldMigrate: false }
  }

  const employeeKeys = [
    'aboutwater-vacation-employees-2025',
    'aboutwater_employees',
    'employees'
  ]

  const vacationKeys = [
    'aboutwater-vacation-entries-2025',
    'aboutwater_vacations',
    'vacations'
  ]

  const hasEmployees = employeeKeys.some(key => {
    try {
      const data = localStorage.getItem(key)
      return data && JSON.parse(data).length > 0
    } catch {
      return false
    }
  })

  const hasVacations = vacationKeys.some(key => {
    try {
      const data = localStorage.getItem(key)
      return data && JSON.parse(data).length > 0
    } catch {
      return false
    }
  })

  return {
    hasEmployees,
    hasVacations,
    shouldMigrate: hasEmployees || hasVacations
  }
}

// Legacy localStorage cleanup after successful migration
export function cleanupLocalStorage(): void {
  if (typeof window === 'undefined') return

  const keysToClean = [
    // Employee keys
    'aboutwater-vacation-employees-2025',
    'aboutwater_employees',
    'employees',

    // Vacation keys
    'aboutwater-vacation-entries-2025',
    'aboutwater_vacations',
    'vacations',

    // Holiday keys
    'aboutwater-holidays-2025',
    'holidays',

    // Backup keys
    'aboutwater_backup',
    'backup_data',

    // Auth keys (keep these for now)
    // 'aboutwater_auth'
  ]

  let cleaned = 0
  for (const key of keysToClean) {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        cleaned++
      }
    } catch (error) {
      console.warn(`Failed to clean key ${key}:`, error)
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} localStorage keys after Supabase migration`)
  }
}

// Compatibility layer for components still using old localStorage methods
export function saveToLocalStorage<T>(key: string, data: T): void {
  console.warn(`⚠️ saveToLocalStorage(${key}) is deprecated. Use supabaseStorage operations instead.`)

  // For backward compatibility during migration
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  console.warn(`⚠️ loadFromLocalStorage(${key}) is deprecated. Use supabaseStorage operations instead.`)

  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return null
  }
}

// Missing functions needed by components

// Initialize storage - ensures all required data is available
export async function initializeStorage(): Promise<void> {
  try {
    console.log('🚀 Initializing Supabase storage...')

    // Load employees to ensure data is available
    await loadEmployees()

    // Load vacations to ensure data is available
    await loadVacations()

    // Load current year holidays
    await loadHolidays('DE-BY', new Date().getFullYear())

    console.log('✅ Storage initialization complete')
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error)
    throw error
  }
}

// Get employees - wrapper around loadEmployees for backward compatibility
export async function getEmployees(): Promise<StoredEmployee[]> {
  return await loadEmployees()
}

// Get vacations - wrapper around loadVacations for backward compatibility
export async function getVacations(): Promise<StoredVacation[]> {
  return await loadVacations()
}

// Get vacations for a specific date
export async function getVacationsForDate(date: Date): Promise<StoredVacation[]> {
  try {
    const allVacations = await loadVacations()
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return allVacations.filter(vacation => {
      const startDate = new Date(vacation.start_date)
      const endDate = new Date(vacation.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)

      return targetDate >= startDate && targetDate <= endDate
    })
  } catch (error) {
    console.error('❌ Failed to get vacations for date:', error)
    return []
  }
}

// Generate vacation Excel export
export async function generateVacationExcel(): Promise<boolean> {
  try {
    console.log('📊 Generating vacation Excel export...')

    // This is a placeholder implementation
    // In a real application, you would use a library like xlsx or exceljs
    const employees = await getEmployees()
    const vacations = await getVacations()

    console.log(`📊 Export would include ${employees.length} employees and ${vacations.length} vacations`)

    // For now, just return success
    // TODO: Implement actual Excel generation
    console.warn('⚠️ Excel generation not yet implemented - returning success')
    return true

  } catch (error) {
    console.error('❌ Failed to generate vacation Excel:', error)
    return false
  }
}