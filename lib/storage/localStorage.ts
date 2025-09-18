// Simple localStorage-based storage for demo purposes
// This allows the system to work immediately without Supabase setup

export interface Employee {
  id: string
  name: string
  email: string | null
  allowance_days: number
  region_code: string
  active: boolean
  created_at: string
}

export interface Vacation {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  note: string | null
  created_at: string
}

export interface Holiday {
  id: string
  region_code: string
  date: string
  name: string
  source: 'google' | 'company'
  created_at: string
}

// Storage keys
const EMPLOYEES_KEY = 'aboutwater_employees'
const VACATIONS_KEY = 'aboutwater_vacations'
const HOLIDAYS_KEY = 'aboutwater_holidays'

// Helper functions
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

// No automatic sample data initialization - let the system start with empty data

// Employee operations
export const getEmployees = async (): Promise<Employee[]> => {
  return getFromStorage<Employee>(EMPLOYEES_KEY)
}

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> => {
  const employees = getFromStorage<Employee>(EMPLOYEES_KEY)
  const newEmployee: Employee = {
    ...employee,
    id: generateId(),
    created_at: new Date().toISOString()
  }
  employees.push(newEmployee)
  saveToStorage(EMPLOYEES_KEY, employees)
  return newEmployee
}

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  const employees = getFromStorage<Employee>(EMPLOYEES_KEY)
  const index = employees.findIndex(emp => emp.id === id)
  if (index === -1) throw new Error('Employee not found')
  
  employees[index] = { ...employees[index], ...updates }
  saveToStorage(EMPLOYEES_KEY, employees)
  return employees[index]
}

// Vacation operations
export const getVacations = async (employeeId?: string, year?: number): Promise<Vacation[]> => {
  let vacations = getFromStorage<Vacation>(VACATIONS_KEY)
  
  if (employeeId) {
    vacations = vacations.filter(v => v.employee_id === employeeId)
  }
  
  if (year) {
    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`
    vacations = vacations.filter(v => v.start_date >= yearStart && v.end_date <= yearEnd)
  }
  
  return vacations.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
}

export const createVacation = async (vacation: Omit<Vacation, 'id' | 'created_at'>): Promise<Vacation> => {
  const vacations = getFromStorage<Vacation>(VACATIONS_KEY)
  const newVacation: Vacation = {
    ...vacation,
    id: generateId(),
    created_at: new Date().toISOString()
  }
  vacations.push(newVacation)
  saveToStorage(VACATIONS_KEY, vacations)
  return newVacation
}

export const deleteVacation = async (id: string): Promise<void> => {
  const vacations = getFromStorage<Vacation>(VACATIONS_KEY)
  const filtered = vacations.filter(v => v.id !== id)
  saveToStorage(VACATIONS_KEY, filtered)
}

// Holiday operations
export const getHolidays = async (regionCode: string = 'DE'): Promise<Holiday[]> => {
  const holidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
  return holidays.filter(h => h.region_code === regionCode).sort((a, b) => a.date.localeCompare(b.date))
}

export const createHoliday = async (holiday: Omit<Holiday, 'id' | 'created_at'>): Promise<Holiday> => {
  const holidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
  const newHoliday: Holiday = {
    ...holiday,
    id: generateId(),
    created_at: new Date().toISOString()
  }
  holidays.push(newHoliday)
  saveToStorage(HOLIDAYS_KEY, holidays)
  return newHoliday
}

export const bulkInsertHolidays = async (holidays: Omit<Holiday, 'id' | 'created_at'>[]): Promise<void> => {
  const existingHolidays = getFromStorage<Holiday>(HOLIDAYS_KEY)

  holidays.forEach(holiday => {
    // Check if holiday already exists (same region and date)
    const exists = existingHolidays.some(
      h => h.region_code === holiday.region_code && h.date === holiday.date
    )

    if (!exists) {
      const newHoliday: Holiday = {
        ...holiday,
        id: generateId(),
        created_at: new Date().toISOString()
      }
      existingHolidays.push(newHoliday)
    }
  })

  saveToStorage(HOLIDAYS_KEY, existingHolidays)
}

export const deleteHoliday = async (id: string): Promise<void> => {
  const holidays = getFromStorage<Holiday>(HOLIDAYS_KEY)
  const filtered = holidays.filter(h => h.id !== id)
  saveToStorage(HOLIDAYS_KEY, filtered)
}
