// ROBUST CLIENT-SIDE STORAGE SYSTEM
// Fixes critical data persistence issues

export interface StoredEmployee {
  id: string
  name: string
  allowance: number
  used: number
  remaining: number
  color: string
}

export interface StoredVacation {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  days: number
  reason: string
  created_at: string
}

// STORAGE KEYS - Versioned for 2025
const STORAGE_KEYS = {
  EMPLOYEES: 'vacation-employees-2025',
  VACATIONS: 'vacation-entries-2025'
} as const

// ROBUST SAVE FUNCTION
export const saveToStorage = (key: string, data: any): boolean => {
  try {
    if (typeof window === 'undefined') return false

    const serialized = JSON.stringify(data)
    localStorage.setItem(key, serialized)
    console.log(`✅ Saved ${key}:`, data)
    return true
  } catch (error) {
    console.error(`❌ Failed to save ${key}:`, error)
    return false
  }
}

// ROBUST LOAD FUNCTION
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') return defaultValue

    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue

    const parsed = JSON.parse(stored)
    console.log(`📖 Loaded ${key}:`, parsed)
    return parsed
  } catch (error) {
    console.error(`❌ Failed to load ${key}:`, error)
    return defaultValue
  }
}

// DEFAULT EMPLOYEE DATA WITH EXACT VALUES
export const getDefaultEmployees = (): StoredEmployee[] => [
  { id: '1', name: 'Andreas Pöppe', allowance: 38.0, used: 28.5, remaining: 9.5, color: '#FF0000' },
  { id: '2', name: 'Anna Kropfitsch', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#0000FF' },
  { id: '3', name: 'Antonio Svagusa', allowance: 26.0, used: 24.0, remaining: 2.0, color: '#008000' },
  { id: '4', name: 'Carmen Berger', allowance: 40.0, used: 22.0, remaining: 18.0, color: '#FF8000' },
  { id: '5', name: 'Cengiz Kina', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#800080' },
  { id: '6', name: 'Christian Irrgang', allowance: 34.0, used: 28.0, remaining: 6.0, color: '#008080' },
  { id: '7', name: 'Daniel Hegemann', allowance: 32.0, used: 29.0, remaining: 3.0, color: '#8B4513' },
  { id: '8', name: 'Estaline Philander', allowance: 30.0, used: 22.0, remaining: 8.0, color: '#FF1493' },
  { id: '9', name: 'Farouk Chasan', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#000080' },
  { id: '10', name: 'Florian Gräf', allowance: 47.0, used: 27.0, remaining: 20.0, color: '#800000' },
  { id: '11', name: 'Giorgi Lomidze', allowance: 30.0, used: 0.0, remaining: 30.0, color: '#2F4F4F' },
  { id: '12', name: 'Hannes Kolm', allowance: 33.0, used: 24.0, remaining: 9.0, color: '#B22222' },
  { id: '13', name: 'Josefine Mättig', allowance: 29.0, used: 29.0, remaining: 0.0, color: '#228B22' },
  { id: '14', name: 'Matthias Herbst', allowance: 36.0, used: 23.0, remaining: 13.0, color: '#4B0082' },
  { id: '15', name: 'Max Sanktjohanser', allowance: 30.0, used: 23.0, remaining: 7.0, color: '#DC143C' },
  { id: '16', name: 'Michael Reiser', allowance: 20.0, used: 19.5, remaining: 0.5, color: '#00CED1' },
  { id: '17', name: 'Mihaela Abmayr', allowance: 27.0, used: 19.0, remaining: 8.0, color: '#FF6347' },
  { id: '18', name: 'Petra Gräf', allowance: 35.0, used: 21.0, remaining: 14.0, color: '#4682B4' },
  { id: '19', name: 'René Kühn', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#D2691E' },
  { id: '20', name: 'Sönke Rocho', allowance: 41.0, used: 31.0, remaining: 10.0, color: '#8B008B' },
  { id: '21', name: 'Thierry Brunner', allowance: 37.0, used: 28.0, remaining: 9.0, color: '#556B2F' },
  { id: '22', name: 'Safat Majumder', allowance: 28.0, used: 0.0, remaining: 28.0, color: '#FF4500' }
]

// EMPLOYEE OPERATIONS
export const getEmployees = (): StoredEmployee[] => {
  return loadFromStorage(STORAGE_KEYS.EMPLOYEES, getDefaultEmployees())
}

export const saveEmployees = (employees: StoredEmployee[]): boolean => {
  return saveToStorage(STORAGE_KEYS.EMPLOYEES, employees)
}

export const updateEmployeeUsage = (employeeId: string, additionalDays: number): StoredEmployee | null => {
  const employees = getEmployees()
  const employeeIndex = employees.findIndex(emp => emp.id === employeeId)

  if (employeeIndex === -1) {
    console.error(`Employee with ID ${employeeId} not found`)
    return null
  }

  employees[employeeIndex].used += additionalDays
  employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used

  saveEmployees(employees)
  return employees[employeeIndex]
}

// VACATION OPERATIONS
export const getVacations = (): StoredVacation[] => {
  return loadFromStorage(STORAGE_KEYS.VACATIONS, [])
}

export const saveVacations = (vacations: StoredVacation[]): boolean => {
  return saveToStorage(STORAGE_KEYS.VACATIONS, vacations)
}

export const addVacation = (employeeId: string, vacationData: {
  startDate: string
  endDate: string
  days: number
  reason?: string
}): { success: boolean; vacation?: StoredVacation; employee?: StoredEmployee } => {
  try {
    // Create vacation entry
    const newVacation: StoredVacation = {
      id: Date.now().toString(),
      employee_id: employeeId,
      start_date: vacationData.startDate,
      end_date: vacationData.endDate,
      days: vacationData.days,
      reason: vacationData.reason || 'Urlaub',
      created_at: new Date().toISOString()
    }

    // Update vacation list
    const vacations = getVacations()
    vacations.push(newVacation)
    saveVacations(vacations)

    // Update employee usage
    const updatedEmployee = updateEmployeeUsage(employeeId, vacationData.days)

    console.log('✅ Vacation added successfully:', newVacation)
    return {
      success: true,
      vacation: newVacation,
      employee: updatedEmployee || undefined
    }
  } catch (error) {
    console.error('❌ Failed to add vacation:', error)
    return { success: false }
  }
}

export const getEmployeeVacations = (employeeId: string): StoredVacation[] => {
  const vacations = getVacations()
  return vacations.filter(vacation => vacation.employee_id === employeeId)
}

export const getVacationsForDate = (date: Date): Array<StoredVacation & { employee: StoredEmployee }> => {
  const vacations = getVacations()
  const employees = getEmployees()

  return vacations.filter(vacation => {
    const startDate = new Date(vacation.start_date)
    const endDate = new Date(vacation.end_date)
    return date >= startDate && date <= endDate
  }).map(vacation => {
    const employee = employees.find(emp => emp.id === vacation.employee_id)!
    return {
      ...vacation,
      employee
    }
  }).filter(v => v.employee) // Only include vacations with valid employees
}

// INITIALIZATION
export const initializeStorage = (): void => {
  if (typeof window === 'undefined') return

  // Initialize employees if not exists
  const employees = loadFromStorage(STORAGE_KEYS.EMPLOYEES, null)
  if (!employees) {
    saveEmployees(getDefaultEmployees())
    console.log('🚀 Initialized default employees')
  }

  // Initialize vacations if not exists
  const vacations = loadFromStorage(STORAGE_KEYS.VACATIONS, null)
  if (!vacations) {
    saveVacations([])
    console.log('🚀 Initialized empty vacations')
  }
}

// AUTO-INITIALIZE ON CLIENT
if (typeof window !== 'undefined') {
  initializeStorage()
}