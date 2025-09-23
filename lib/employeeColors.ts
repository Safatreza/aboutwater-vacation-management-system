// Employee color coding system for AboutWater GmbH
// Each employee gets a unique, professional color for calendar and display purposes

export interface EmployeeWithColor {
  id: string
  name: string
  color: string
  allowance_days: number
  region_code: string
  active: boolean
}

// Professional color palette for 21 employees
export const EMPLOYEE_COLORS = [
  '#1c5975', // Andreas Pöppe
  '#2a6b8a', // Anna Kropfitsch
  '#3a7d9f', // Carmen Berger
  '#4a8fb4', // Cengiz Kina
  '#5aa1c9', // Christian Irrgang
  '#6ab3de', // Daniel Hegemann
  '#7ac5f3', // Estaline Philander
  '#8ad7ff', // Florian Gräf
  '#9ae9ff', // Giorgi Lomidze
  '#aafbff', // Grit Harder
  '#bb5975', // Hannes Kolm
  '#cc6b8a', // Josefine Mättig
  '#dd7d9f', // Matthias Herbst
  '#ee8fb4', // Maximilian Sanktjohansen
  '#ffa1c9', // Michael Reiser
  '#ffb3de', // Mihaela Abmayr
  '#ffc5f3', // Petra Gräf
  '#ffd7ff', // Rene Kühn
  '#FF4500', // Safat Majumder (Orange Red)
  '#fffbff', // Sönke Rocho
  '#f0f0f0'  // Thierry Brunner
]

// Get color by employee ID (1-based indexing)
export function getEmployeeColor(employeeId: string | number): string {
  const id = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId
  const index = id - 1 // Convert to 0-based index

  if (index >= 0 && index < EMPLOYEE_COLORS.length) {
    return EMPLOYEE_COLORS[index]
  }

  // Fallback to AboutWater primary color
  return '#1c5975'
}

// Get color by employee name (for cases where we only have the name)
export function getEmployeeColorByName(name: string): string {
  const employeeNames = [
    'Andreas Pöppe',
    'Anna Kropfitsch',
    'Carmen Berger',
    'Cengiz Kina',
    'Christian Irrgang',
    'Daniel Hegemann',
    'Estaline Philander',
    'Florian Gräf',
    'Giorgi Lomidze',
    'Grit Harder',
    'Hannes Kolm',
    'Josefine Mättig',
    'Matthias Herbst',
    'Maximilian Sanktjohansen',
    'Michael Reiser',
    'Mihaela Abmayr',
    'Petra Gräf',
    'Rene Kühn',
    'Safat Majumder',
    'Sönke Rocho',
    'Thierry Brunner'
  ]

  const index = employeeNames.indexOf(name)
  return index >= 0 ? EMPLOYEE_COLORS[index] : '#1c5975'
}

// Add color property to employee objects
export function addColorsToEmployees(employees: any[]): EmployeeWithColor[] {
  return employees.map(employee => ({
    ...employee,
    color: getEmployeeColor(employee.id)
  }))
}

// Get contrasting text color for a given background color
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff'
}