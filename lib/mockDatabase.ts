// Mock database for demo purposes when Supabase is not available
// This simulates database operations using localStorage in the browser
// and in-memory storage on the server

import { Employee, EmployeeInsert, Vacation, VacationInsert, Holiday } from '@/types/database'

// Server-side in-memory storage
let serverEmployees: Employee[] | null = null
let serverVacations: Vacation[] | null = null
let serverHolidays: Holiday[] | null = null

// Complete AboutWater GmbH employee list with exact 2025 vacation data (21 employees)
let mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Andreas Pöppe',
    allowance_days: 38.0,
    used_vacation_days: 28.5,
    remaining_vacation: 9.5,
    region_code: 'DE',
    color: '#FF0000',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Anna Kropfitsch',
    allowance_days: 0.0,
    used_vacation_days: 0.0,
    remaining_vacation: 0.0,
    region_code: 'DE',
    color: '#0000FF',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Antonio Svagusa',
    allowance_days: 26.0,
    used_vacation_days: 24.0,
    remaining_vacation: 2.0,
    region_code: 'DE',
    color: '#008000',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Carmen Berger',
    allowance_days: 40.0,
    used_vacation_days: 22.0,
    remaining_vacation: 18.0,
    region_code: 'DE',
    color: '#FF8000',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Cengiz Kina',
    allowance_days: 0.0,
    used_vacation_days: 0.0,
    remaining_vacation: 0.0,
    region_code: 'DE',
    color: '#800080',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Christian Irrgang',
    allowance_days: 34.0,
    used_vacation_days: 28.0,
    remaining_vacation: 6.0,
    region_code: 'DE',
    color: '#008080',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Daniel Hegemann',
    allowance_days: 32.0,
    used_vacation_days: 29.0,
    remaining_vacation: 3.0,
    region_code: 'DE',
    color: '#8B4513',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Estaline Philander',
    allowance_days: 30.0,
    used_vacation_days: 22.0,
    remaining_vacation: 8.0,
    region_code: 'DE',
    color: '#FF1493',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Farouk Chasan',
    allowance_days: 32.5,
    used_vacation_days: 28.0,
    remaining_vacation: 4.5,
    region_code: 'DE',
    color: '#000080',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '10',
    name: 'Florian Gräf',
    allowance_days: 47.0,
    used_vacation_days: 27.0,
    remaining_vacation: 20.0,
    region_code: 'DE',
    color: '#800000',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '11',
    name: 'Giorgi Lomidze',
    allowance_days: 30.0,
    used_vacation_days: 0.0,
    remaining_vacation: 30.0,
    region_code: 'DE',
    color: '#2F4F4F',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Hannes Kolm',
    allowance_days: 33.0,
    used_vacation_days: 24.0,
    remaining_vacation: 9.0,
    region_code: 'DE',
    color: '#B22222',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '13',
    name: 'Josefine Mättig',
    allowance_days: 29.0,
    used_vacation_days: 29.0,
    remaining_vacation: 0.0,
    region_code: 'DE',
    color: '#228B22',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '14',
    name: 'Matthias Herbst',
    allowance_days: 36.0,
    used_vacation_days: 23.0,
    remaining_vacation: 13.0,
    region_code: 'DE',
    color: '#4B0082',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '15',
    name: 'Max Sanktjohanser',
    allowance_days: 30.0,
    used_vacation_days: 23.0,
    remaining_vacation: 7.0,
    region_code: 'DE',
    color: '#DC143C',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '16',
    name: 'Michael Reiser',
    allowance_days: 20.0,
    used_vacation_days: 19.5,
    remaining_vacation: 0.5,
    region_code: 'DE',
    color: '#00CED1',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '17',
    name: 'Mihaela Abmayr',
    allowance_days: 27.0,
    used_vacation_days: 19.0,
    remaining_vacation: 8.0,
    region_code: 'DE',
    color: '#FF6347',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '18',
    name: 'Petra Gräf',
    allowance_days: 35.0,
    used_vacation_days: 21.0,
    remaining_vacation: 14.0,
    region_code: 'DE',
    color: '#4682B4',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '19',
    name: 'René Kühn',
    allowance_days: 32.5,
    used_vacation_days: 28.0,
    remaining_vacation: 4.5,
    region_code: 'DE',
    color: '#D2691E',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '20',
    name: 'Sönke Rocho',
    allowance_days: 41.0,
    used_vacation_days: 31.0,
    remaining_vacation: 10.0,
    region_code: 'DE',
    color: '#8B008B',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '21',
    name: 'Thierry Brunner',
    allowance_days: 37.0,
    used_vacation_days: 28.0,
    remaining_vacation: 9.0,
    region_code: 'DE',
    color: '#556B2F',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '22',
    name: 'Safat Majumder',
    allowance_days: 28.0,
    used_vacation_days: 0.0,
    remaining_vacation: 28.0,
    region_code: 'DE',
    color: '#FF4500',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Sample vacation data for demonstration
let mockVacations: Vacation[] = [
  {
    id: 'vacation-1',
    employee_id: '1', // Andreas Pöppe
    start_date: '2025-03-10',
    end_date: '2025-03-14',
    working_days: 5,
    note: 'Spring Break',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vacation-2',
    employee_id: '4', // Carmen Berger
    start_date: '2025-06-15',
    end_date: '2025-06-20',
    working_days: 4,
    note: 'Summer Vacation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vacation-3',
    employee_id: '10', // Florian Gräf
    start_date: '2025-07-07',
    end_date: '2025-07-18',
    working_days: 10,
    note: 'Summer Holiday',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vacation-4',
    employee_id: '18', // Petra Gräf
    start_date: '2025-08-25',
    end_date: '2025-08-29',
    working_days: 5,
    note: 'Late Summer Break',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'vacation-5',
    employee_id: '12', // Hannes Kolm
    start_date: '2025-12-23',
    end_date: '2025-12-30',
    working_days: 6,
    note: 'Christmas Holidays',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// Complete Bavaria holidays and school breaks for 2025
let mockHolidays: Holiday[] = [
  // School Breaks (Ferien)
  {
    id: 'ferien-1',
    region_code: 'DE',
    date: '2024-12-23',
    name: 'Weihnachtsferien Vorjahr',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-2',
    region_code: 'DE',
    date: '2025-03-03',
    name: 'Faschingsferien',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-3',
    region_code: 'DE',
    date: '2025-04-14',
    name: 'Osterferien',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-4',
    region_code: 'DE',
    date: '2025-06-10',
    name: 'Pfingstferien',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-5',
    region_code: 'DE',
    date: '2025-08-01',
    name: 'Sommerferien',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-6',
    region_code: 'DE',
    date: '2025-11-03',
    name: 'Herbstferien',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-7',
    region_code: 'DE',
    date: '2025-11-19',
    name: 'Buß-und Bettag',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ferien-8',
    region_code: 'DE',
    date: '2025-12-22',
    name: 'Weihnachtsferien dieses Jahr',
    source: 'Bayern Kultusministerium',
    created_at: new Date().toISOString()
  },

  // Public Holidays (Feiertag)
  {
    id: 'feiertag-1',
    region_code: 'DE',
    date: '2025-01-01',
    name: 'Neujahr',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-2',
    region_code: 'DE',
    date: '2025-01-06',
    name: 'Heilige Drei Könige',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-3',
    region_code: 'DE',
    date: '2025-04-18',
    name: 'Karfreitag',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-4',
    region_code: 'DE',
    date: '2025-04-21',
    name: 'Ostermontag',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-5',
    region_code: 'DE',
    date: '2025-05-01',
    name: 'Tag der Arbeit',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-6',
    region_code: 'DE',
    date: '2025-05-29',
    name: 'Christi Himmelfahrt',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-7',
    region_code: 'DE',
    date: '2025-06-09',
    name: 'Pfingstmontag',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-8',
    region_code: 'DE',
    date: '2025-06-19',
    name: 'Fronleichnam',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-9',
    region_code: 'DE',
    date: '2025-08-15',
    name: 'Mariä Himmelfahrt',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-10',
    region_code: 'DE',
    date: '2025-10-03',
    name: 'Tag der Deutschen Einheit',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-11',
    region_code: 'DE',
    date: '2025-11-01',
    name: 'Allerheiligen',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-12',
    region_code: 'DE',
    date: '2025-12-25',
    name: '1. Weihnachtsfeiertag',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  },
  {
    id: 'feiertag-13',
    region_code: 'DE',
    date: '2025-12-26',
    name: '2. Weihnachtsfeiertag',
    source: 'Bayern Gesetzlich',
    created_at: new Date().toISOString()
  }
]

export const mockDb = {
  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)

    // Convert clientStorage format to database format if needed
    const convertedEmployees = employees.map((emp: any) => {
      // Handle both formats: clientStorage {allowance, used, remaining} and database {allowance_days, used_vacation_days, remaining_vacation}
      if (emp.allowance !== undefined && emp.allowance_days === undefined) {
        // Convert from clientStorage format
        return {
          ...emp,
          allowance_days: emp.allowance,
          used_vacation_days: emp.used,
          remaining_vacation: emp.remaining,
          active: true
        }
      }
      return emp
    })

    return convertedEmployees.filter((emp: Employee) => emp.active)
  },

  async getEmployee(id: string): Promise<Employee | null> {
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)
    return employees.find((emp: Employee) => emp.id === id && emp.active) || null
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)
    const employeeIndex = employees.findIndex((emp: Employee) => emp.id === id)

    if (employeeIndex === -1) {
      return null
    }

    employees[employeeIndex] = {
      ...employees[employeeIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    saveToStorage(STORAGE_KEYS.employees, employees)
    return employees[employeeIndex]
  },

  async createEmployee(data: EmployeeInsert): Promise<Employee> {
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)
    const employee: Employee = {
      id: crypto.randomUUID(),
      name: data.name,
      allowance_days: data.allowance_days || 25,
      used_vacation_days: data.used_vacation_days || 0,
      remaining_vacation: data.remaining_vacation || data.allowance_days || 25,
      region_code: data.region_code || 'DE',
      color: data.color,
      active: data.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    employees.push(employee)
    saveToStorage(STORAGE_KEYS.employees, employees)
    return employee
  },

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)
    const vacations = loadFromStorage(STORAGE_KEYS.vacations, mockVacations)

    const employeeIndex = employees.findIndex((emp: Employee) => emp.id === id)
    if (employeeIndex === -1) {
      return { success: false, message: 'Employee not found' }
    }

    const employee = employees[employeeIndex]
    const hasVacations = vacations.some((vac: Vacation) => vac.employee_id === id)

    if (hasVacations) {
      // Soft delete
      employees[employeeIndex] = { ...employee, active: false }
      saveToStorage(STORAGE_KEYS.employees, employees)
      return { success: true, message: `Employee ${employee.name} has been deactivated (has vacation records)` }
    } else {
      // Hard delete
      employees.splice(employeeIndex, 1)
      saveToStorage(STORAGE_KEYS.employees, employees)
      return { success: true, message: `Employee ${employee.name} has been deleted` }
    }
  },

  // Vacation operations
  async getVacations(employeeId?: string, year?: number): Promise<Vacation[]> {
    let vacations = loadFromStorage(STORAGE_KEYS.vacations, mockVacations)

    // Convert clientStorage format to database format if needed
    const convertedVacations = vacations.map((vac: any) => {
      // Handle both formats: clientStorage {days, reason} and database {working_days, note}
      if (vac.days !== undefined && vac.working_days === undefined) {
        return {
          ...vac,
          working_days: vac.days,
          note: vac.reason || null
        }
      }
      return vac
    })

    let filteredVacations = convertedVacations

    if (employeeId) {
      filteredVacations = filteredVacations.filter((vac: Vacation) => vac.employee_id === employeeId)
    }

    if (year) {
      filteredVacations = filteredVacations.filter((vac: Vacation) => {
        const vacYear = new Date(vac.start_date).getFullYear()
        return vacYear === year
      })
    }

    return filteredVacations
  },

  async createVacation(data: VacationInsert): Promise<Vacation> {
    const vacations = loadFromStorage(STORAGE_KEYS.vacations, mockVacations)
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)

    const vacation: Vacation = {
      id: crypto.randomUUID(),
      employee_id: data.employee_id,
      start_date: data.start_date,
      end_date: data.end_date,
      note: data.note || null,
      working_days: data.working_days || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    vacations.push(vacation)
    saveToStorage(STORAGE_KEYS.vacations, vacations)

    // CRITICAL: Update employee's vacation totals - Handle both formats
    const employeeIndex = employees.findIndex((emp: any) => emp.id === data.employee_id)
    if (employeeIndex !== -1) {
      const employee = employees[employeeIndex]

      // Handle clientStorage format vs database format
      const currentUsed = employee.used || employee.used_vacation_days || 0
      const allowance = employee.allowance || employee.allowance_days
      const newUsedDays = currentUsed + vacation.working_days
      const newRemainingDays = allowance - newUsedDays

      // Update in both formats to ensure compatibility
      employees[employeeIndex] = {
        ...employee,
        // Database format
        used_vacation_days: newUsedDays,
        remaining_vacation: newRemainingDays,
        allowance_days: allowance,
        // ClientStorage format
        used: newUsedDays,
        remaining: newRemainingDays,
        allowance: allowance,
        updated_at: new Date().toISOString()
      }

      saveToStorage(STORAGE_KEYS.employees, employees)
      console.log(`🔄 Updated employee ${employee.name}: used ${newUsedDays}, remaining ${newRemainingDays}`)
    }

    return vacation
  },

  async deleteVacation(id: string): Promise<{ success: boolean; vacation?: Vacation }> {
    const vacations = loadFromStorage(STORAGE_KEYS.vacations, mockVacations)
    const employees = loadFromStorage(STORAGE_KEYS.employees, mockEmployees)

    const vacationIndex = vacations.findIndex((vac: Vacation) => vac.id === id)
    if (vacationIndex === -1) {
      return { success: false }
    }

    const vacation = vacations[vacationIndex]
    vacations.splice(vacationIndex, 1)
    saveToStorage(STORAGE_KEYS.vacations, vacations)

    // CRITICAL: Update employee's vacation totals when deleting vacation - Handle both formats
    const employeeIndex = employees.findIndex((emp: any) => emp.id === vacation.employee_id)
    if (employeeIndex !== -1) {
      const employee = employees[employeeIndex]

      // Handle clientStorage format vs database format
      const currentUsed = employee.used || employee.used_vacation_days || 0
      const allowance = employee.allowance || employee.allowance_days
      const newUsedDays = Math.max(0, currentUsed - vacation.working_days)
      const newRemainingDays = allowance - newUsedDays

      // Update in both formats to ensure compatibility
      employees[employeeIndex] = {
        ...employee,
        // Database format
        used_vacation_days: newUsedDays,
        remaining_vacation: newRemainingDays,
        allowance_days: allowance,
        // ClientStorage format
        used: newUsedDays,
        remaining: newRemainingDays,
        allowance: allowance,
        updated_at: new Date().toISOString()
      }

      saveToStorage(STORAGE_KEYS.employees, employees)
      console.log(`🔄 Updated employee ${employee.name} after deletion: used ${newUsedDays}, remaining ${newRemainingDays}`)
    }

    return { success: true, vacation }
  },

  // Holiday operations
  async getHolidays(regionCode = 'DE', year?: number): Promise<Holiday[]> {
    const holidays = loadFromStorage(STORAGE_KEYS.holidays, mockHolidays)
    let filteredHolidays = holidays.filter((h: Holiday) => h.region_code === regionCode)

    if (year) {
      filteredHolidays = filteredHolidays.filter((h: Holiday) => {
        const holidayYear = new Date(h.date).getFullYear()
        return holidayYear === year
      })
    }

    return filteredHolidays
  },

  async upsertHoliday(data: { region_code: string; date: string; name: string; source: string }): Promise<Holiday> {
    const holidays = loadFromStorage(STORAGE_KEYS.holidays, mockHolidays)
    const existingIndex = holidays.findIndex(
      (h: Holiday) => h.region_code === data.region_code && h.date === data.date
    )

    if (existingIndex >= 0) {
      // Update existing
      holidays[existingIndex] = {
        ...holidays[existingIndex],
        name: data.name,
        source: data.source
      }
      saveToStorage(STORAGE_KEYS.holidays, holidays)
      return holidays[existingIndex]
    } else {
      // Create new
      const holiday: Holiday = {
        id: crypto.randomUUID(),
        region_code: data.region_code,
        date: data.date,
        name: data.name,
        source: data.source,
        created_at: new Date().toISOString()
      }
      holidays.push(holiday)
      saveToStorage(STORAGE_KEYS.holidays, holidays)
      return holiday
    }
  }
}

// localStorage persistence for client-side storage - UNIFIED KEYS with clientStorage.ts
const STORAGE_KEYS = {
  employees: 'vacation-employees-2025',
  vacations: 'vacation-entries-2025',
  holidays: 'aboutwater_holidays'
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  // Server-side: use in-memory storage
  if (typeof window === 'undefined') {
    switch (key) {
      case STORAGE_KEYS.employees:
        if (serverEmployees === null) {
          serverEmployees = [...mockEmployees] // Initialize with default data
        }
        return serverEmployees as T
      case STORAGE_KEYS.vacations:
        if (serverVacations === null) {
          serverVacations = []
        }
        return serverVacations as T
      case STORAGE_KEYS.holidays:
        if (serverHolidays === null) {
          serverHolidays = [...mockHolidays]
        }
        return serverHolidays as T
      default:
        return defaultValue
    }
  }

  // Client-side: use localStorage
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error)
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  // Server-side: update in-memory storage
  if (typeof window === 'undefined') {
    switch (key) {
      case STORAGE_KEYS.employees:
        serverEmployees = [...(data as Employee[])]
        console.log(`Server storage updated: ${serverEmployees.length} employees`)
        break
      case STORAGE_KEYS.vacations:
        serverVacations = [...(data as Vacation[])]
        console.log(`Server storage updated: ${serverVacations.length} vacations`)
        break
      case STORAGE_KEYS.holidays:
        serverHolidays = [...(data as Holiday[])]
        break
    }
    return
  }

  // Client-side: use localStorage
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

// Initialize storage with default data if empty
function initializeStorage() {
  if (typeof window === 'undefined') return

  // Initialize employees if not present
  const storedEmployees = loadFromStorage(STORAGE_KEYS.employees, [])
  if (storedEmployees.length === 0) {
    saveToStorage(STORAGE_KEYS.employees, mockEmployees)
  }

  // Initialize holidays if not present
  const storedHolidays = loadFromStorage(STORAGE_KEYS.holidays, [])
  if (storedHolidays.length === 0) {
    saveToStorage(STORAGE_KEYS.holidays, mockHolidays)
  }

  // Initialize vacations (can be empty)
  const storedVacations = loadFromStorage(STORAGE_KEYS.vacations, [])
  saveToStorage(STORAGE_KEYS.vacations, storedVacations)
}

// Call initialization
if (typeof window !== 'undefined') {
  initializeStorage()
}

export function isMockMode(): boolean {
  // Check if force mock mode is enabled
  if (process.env.NEXT_PUBLIC_FORCE_MOCK_MODE === 'true') {
    return true
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use real Supabase database if credentials are available
  return !supabaseUrl || !supabaseKey
}