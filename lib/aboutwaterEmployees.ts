// AboutWater GmbH Employee Directory
// Dynamic employee data with real company employees

export interface AboutWaterEmployee {
  id: string
  name: string
  region: string
  allowance_days: number // Actual 2025 vacation allowance
  used_vacation_days: number // Actual 2025 used vacation days
  remaining_vacation: number // Actual 2025 remaining vacation
  color: string // Assigned color for visual identification
}

// Real AboutWater employees with exact 2025 vacation usage data
export const ABOUTWATER_EMPLOYEES: Omit<AboutWaterEmployee, 'allowance_days' | 'used_vacation_days' | 'remaining_vacation'>[] = [
  { id: '1', name: 'Andreas Pöppe', region: 'DE', color: '#FF0000' },
  { id: '2', name: 'Anna Kropfitsch', region: 'DE', color: '#0000FF' },
  { id: '3', name: 'Antonio Svagusa', region: 'DE', color: '#008000' },
  { id: '4', name: 'Carmen Berger', region: 'DE', color: '#FF8000' },
  { id: '5', name: 'Cengiz Kina', region: 'DE', color: '#800080' },
  { id: '6', name: 'Christian Irrgang', region: 'DE', color: '#008080' },
  { id: '7', name: 'Daniel Hegemann', region: 'DE', color: '#8B4513' },
  { id: '8', name: 'Estaline Philander', region: 'DE', color: '#FF1493' },
  { id: '9', name: 'Farouk Chasan', region: 'DE', color: '#000080' },
  { id: '10', name: 'Florian Gräf', region: 'DE', color: '#800000' },
  { id: '11', name: 'Giorgi Lomidze', region: 'DE', color: '#2F4F4F' },
  { id: '12', name: 'Hannes Kolm', region: 'DE', color: '#B22222' },
  { id: '13', name: 'Josefine Mättig', region: 'DE', color: '#228B22' },
  { id: '14', name: 'Matthias Herbst', region: 'DE', color: '#4B0082' },
  { id: '15', name: 'Max Sanktjohanser', region: 'DE', color: '#DC143C' },
  { id: '16', name: 'Michael Reiser', region: 'DE', color: '#00CED1' },
  { id: '17', name: 'Mihaela Abmayr', region: 'DE', color: '#FF6347' },
  { id: '18', name: 'Petra Gräf', region: 'DE', color: '#4682B4' },
  { id: '19', name: 'René Kühn', region: 'DE', color: '#D2691E' },
  { id: '20', name: 'Sönke Rocho', region: 'DE', color: '#8B008B' },
  { id: '21', name: 'Thierry Brunner', region: 'DE', color: '#556B2F' },
  { id: '22', name: 'Safat Majumder', region: 'DE', color: '#FF4500' }
]

// Exact 2025 vacation usage data
export const EMPLOYEE_2025_DATA: Record<string, { allowance_days: number; used_vacation_days: number; remaining_vacation: number }> = {
  '1': { allowance_days: 38.0, used_vacation_days: 28.5, remaining_vacation: 9.5 },
  '2': { allowance_days: 0.0, used_vacation_days: 0.0, remaining_vacation: 0.0 },
  '3': { allowance_days: 26.0, used_vacation_days: 24.0, remaining_vacation: 2.0 },
  '4': { allowance_days: 40.0, used_vacation_days: 22.0, remaining_vacation: 18.0 },
  '5': { allowance_days: 0.0, used_vacation_days: 0.0, remaining_vacation: 0.0 },
  '6': { allowance_days: 34.0, used_vacation_days: 28.0, remaining_vacation: 6.0 },
  '7': { allowance_days: 32.0, used_vacation_days: 29.0, remaining_vacation: 3.0 },
  '8': { allowance_days: 30.0, used_vacation_days: 22.0, remaining_vacation: 8.0 },
  '9': { allowance_days: 32.5, used_vacation_days: 28.0, remaining_vacation: 4.5 },
  '10': { allowance_days: 47.0, used_vacation_days: 27.0, remaining_vacation: 20.0 },
  '11': { allowance_days: 30.0, used_vacation_days: 0.0, remaining_vacation: 30.0 },
  '12': { allowance_days: 33.0, used_vacation_days: 24.0, remaining_vacation: 9.0 },
  '13': { allowance_days: 29.0, used_vacation_days: 29.0, remaining_vacation: 0.0 },
  '14': { allowance_days: 36.0, used_vacation_days: 23.0, remaining_vacation: 13.0 },
  '15': { allowance_days: 30.0, used_vacation_days: 23.0, remaining_vacation: 7.0 },
  '16': { allowance_days: 20.0, used_vacation_days: 19.5, remaining_vacation: 0.5 },
  '17': { allowance_days: 27.0, used_vacation_days: 19.0, remaining_vacation: 8.0 },
  '18': { allowance_days: 35.0, used_vacation_days: 21.0, remaining_vacation: 14.0 },
  '19': { allowance_days: 32.5, used_vacation_days: 28.0, remaining_vacation: 4.5 },
  '20': { allowance_days: 41.0, used_vacation_days: 31.0, remaining_vacation: 10.0 },
  '21': { allowance_days: 37.0, used_vacation_days: 28.0, remaining_vacation: 9.0 },
  '22': { allowance_days: 28.0, used_vacation_days: 0.0, remaining_vacation: 28.0 }
}

// Default vacation allowance for new employees
export const DEFAULT_VACATION_ALLOWANCE = 25

// Create AboutWater employee with dynamic allowance
export function createAboutWaterEmployee(
  baseEmployee: Omit<AboutWaterEmployee, 'allowance_days'>,
  allowanceDays: number = DEFAULT_VACATION_ALLOWANCE
): AboutWaterEmployee {
  return {
    ...baseEmployee,
    allowance_days: allowanceDays
  }
}

// Get all AboutWater employees with exact 2025 vacation data
export function getAboutWaterEmployeesWithDefaults(): AboutWaterEmployee[] {
  return ABOUTWATER_EMPLOYEES.map(emp => {
    const vacationData = EMPLOYEE_2025_DATA[emp.id] || {
      allowance_days: DEFAULT_VACATION_ALLOWANCE,
      used_vacation_days: 0,
      remaining_vacation: DEFAULT_VACATION_ALLOWANCE
    }

    return {
      ...emp,
      allowance_days: vacationData.allowance_days,
      used_vacation_days: vacationData.used_vacation_days,
      remaining_vacation: vacationData.remaining_vacation
    }
  })
}

// Check if an employee ID exists in AboutWater directory
export function isAboutWaterEmployee(employeeId: string): boolean {
  return ABOUTWATER_EMPLOYEES.some(emp => emp.id === employeeId)
}

// Get AboutWater employee by ID
export function getAboutWaterEmployeeById(employeeId: string): Omit<AboutWaterEmployee, 'allowance_days' | 'used_vacation_days' | 'remaining_vacation'> | null {
  return ABOUTWATER_EMPLOYEES.find(emp => emp.id === employeeId) || null
}