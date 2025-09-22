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

// ENHANCED STORAGE KEYS with backup system
const STORAGE_KEYS = {
  EMPLOYEES: 'aboutwater-vacation-employees-2025',
  VACATIONS: 'aboutwater-vacation-entries-2025',
  HOLIDAYS: 'aboutwater-holidays-2025'
} as const

// BULLETPROOF SAVE FUNCTION with verification and event dispatch
export const saveToStorage = (key: string, data: any): boolean => {
  try {
    if (typeof window === 'undefined') return false

    const jsonData = JSON.stringify(data)
    localStorage.setItem(key, jsonData)
    console.log(`✅ Successfully saved ${key}:`, data)

    // Verify save worked
    const verification = localStorage.getItem(key)
    if (!verification) {
      throw new Error('Data was not saved to localStorage')
    }

    // Double-check by parsing
    JSON.parse(verification)

    // Dispatch custom event for same-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('localStorageUpdate', {
        detail: { key, data }
      }))
    }

    return true
  } catch (error) {
    console.error(`❌ Failed to save ${key}:`, error)
    alert(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

// BULLETPROOF LOAD FUNCTION with fallback
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (typeof window === 'undefined') return defaultValue

    const stored = localStorage.getItem(key)
    if (!stored) {
      console.log(`📝 No data found for ${key}, using defaults`)
      return defaultValue
    }

    const parsed = JSON.parse(stored)
    console.log(`✅ Successfully loaded ${key}:`, parsed)
    return parsed
  } catch (error) {
    console.error(`❌ Failed to load ${key}:`, error)
    // Try to repair corrupted data
    try {
      localStorage.removeItem(key)
      console.log(`🔧 Removed corrupted data for ${key}`)
    } catch (cleanupError) {
      console.error(`❌ Failed to cleanup corrupted data:`, cleanupError)
    }
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

// BULLETPROOF VACATION ADDITION with immediate persistence verification
export const addVacationToPersistentStorage = (employeeId: string, vacationData: {
  startDate: string
  endDate: string
  days: number
  type?: string
  reason?: string
}): { success: boolean; vacation?: StoredVacation; employee?: StoredEmployee; employees?: StoredEmployee[]; vacations?: StoredVacation[] } => {
  console.log('🔄 Adding vacation:', { employeeId, vacationData })

  try {
    // Load current data
    const employees = loadFromStorage(STORAGE_KEYS.EMPLOYEES, getDefaultEmployees())
    const vacations: StoredVacation[] = loadFromStorage(STORAGE_KEYS.VACATIONS, [])

    // Create vacation entry with detailed data
    const newVacation: StoredVacation = {
      id: `vacation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employee_id: employeeId,
      start_date: vacationData.startDate,
      end_date: vacationData.endDate,
      days: parseFloat(vacationData.days.toString()) || 1,
      reason: vacationData.reason || 'Urlaub (ganzer Tag)',
      created_at: new Date().toISOString()
    }

    // Update employee data
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId || emp.name === employeeId)
    if (employeeIndex === -1) {
      console.error(`❌ Employee with ID ${employeeId} not found`)
      return { success: false }
    }

    employees[employeeIndex].used = parseFloat(employees[employeeIndex].used.toString()) + parseFloat(newVacation.days.toString())
    employees[employeeIndex].remaining = parseFloat(employees[employeeIndex].allowance.toString()) - parseFloat(employees[employeeIndex].used.toString())
    console.log('🔄 Updated employee:', employees[employeeIndex])

    // Add vacation to list
    vacations.push(newVacation)

    // Save both datasets with verification
    const employeeSaveSuccess = saveToStorage(STORAGE_KEYS.EMPLOYEES, employees)
    const vacationSaveSuccess = saveToStorage(STORAGE_KEYS.VACATIONS, vacations)

    if (employeeSaveSuccess && vacationSaveSuccess) {
      console.log('✅ Vacation successfully added and persisted')
      return {
        success: true,
        vacation: newVacation,
        employee: employees[employeeIndex],
        employees,
        vacations
      }
    } else {
      console.error('❌ Failed to persist vacation data')
      return { success: false }
    }
  } catch (error) {
    console.error('❌ Failed to add vacation:', error)
    alert(`Failed to add vacation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { success: false }
  }
}

// Keep the original function for backward compatibility
export const addVacation = addVacationToPersistentStorage

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

// EXCEL EXPORT FUNCTIONALITY
export const generateVacationExcel = async (): Promise<boolean> => {
  try {
    // Dynamic import to avoid SSR issues
    const ExcelJS = (await import('exceljs')).default

    const employees = loadFromStorage(STORAGE_KEYS.EMPLOYEES, getDefaultEmployees())
    const vacations = loadFromStorage(STORAGE_KEYS.VACATIONS, [])

    const workbook = new ExcelJS.Workbook()

    // Sheet 1: Employee Summary
    const summarySheet = workbook.addWorksheet('Employee Summary')
    summarySheet.columns = [
      { header: 'Employee Name', key: 'name', width: 20 },
      { header: 'Allowed Days', key: 'allowance', width: 15 },
      { header: 'Used Days', key: 'used', width: 15 },
      { header: 'Remaining Days', key: 'remaining', width: 15 },
      { header: 'Usage %', key: 'percentage', width: 15 }
    ]

    employees.forEach(employee => {
      const percentage = employee.allowance > 0 ? Math.round((employee.used / employee.allowance) * 100) : 0
      summarySheet.addRow({
        name: employee.name,
        allowance: employee.allowance,
        used: employee.used,
        remaining: employee.remaining,
        percentage: `${percentage}%`
      })
    })

    // Format header row
    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1c5975' }
    }
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Sheet 2: Vacation Details
    const vacationSheet = workbook.addWorksheet('Vacation Details')
    vacationSheet.columns = [
      { header: 'Employee', key: 'employee', width: 20 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Days Used', key: 'days', width: 15 },
      { header: 'Reason', key: 'reason', width: 30 },
      { header: 'Created', key: 'created', width: 20 }
    ]

    vacations.forEach((vacation: StoredVacation) => {
      const employee = employees.find(emp => emp.id === vacation.employee_id)
      vacationSheet.addRow({
        employee: employee?.name || vacation.employee_id,
        startDate: vacation.start_date,
        endDate: vacation.end_date,
        days: vacation.days,
        reason: vacation.reason,
        created: new Date(vacation.created_at).toLocaleDateString('de-DE')
      })
    })

    // Format header row
    vacationSheet.getRow(1).font = { bold: true }
    vacationSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1c5975' }
    }
    vacationSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Sheet 3: Employee Colors (for reference)
    const colorSheet = workbook.addWorksheet('Employee Colors')
    colorSheet.columns = [
      { header: 'Employee Name', key: 'name', width: 20 },
      { header: 'Color Code', key: 'color', width: 15 },
      { header: 'Employee ID', key: 'id', width: 15 }
    ]

    employees.forEach(employee => {
      colorSheet.addRow({
        name: employee.name,
        color: employee.color,
        id: employee.id
      })
    })

    // Format header row
    colorSheet.getRow(1).font = { bold: true }
    colorSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1c5975' }
    }
    colorSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `AboutWater_Vacation_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('✅ Excel report downloaded successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to generate Excel report:', error)
    alert(`Failed to generate Excel report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return false
  }
}

// AUTO-INITIALIZE ON CLIENT
if (typeof window !== 'undefined') {
  initializeStorage()
}