// DATABASE OPERATIONS SYSTEM
// Replaces localStorage with Supabase for multi-user data persistence

import { supabase } from '@/lib/supabase'
import { Database, Employee, EmployeeInsert, Vacation, VacationInsert } from '@/types/database'

// Types for the application
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

// Color palette for employees
const DEFAULT_COLORS = [
  '#FF0000', '#0000FF', '#008000', '#FF8000', '#800080', '#008080',
  '#8B4513', '#FF1493', '#000080', '#800000', '#2F4F4F', '#B22222',
  '#228B22', '#4B0082', '#DC143C', '#00CED1', '#FF6347', '#4682B4',
  '#D2691E', '#8B008B', '#556B2F', '#FF4500'
]

// EMPLOYEE DATABASE OPERATIONS

export const saveEmployeesToDatabase = async (employees: StoredEmployee[]): Promise<boolean> => {
  try {
    console.log('🔄 Saving employees to database...', employees)

    // Clear existing employees (keeping system employees)
    await supabase
      .from('employees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert new employees
    const employeeInserts = employees.map(emp => ({
      name: emp.name,
      allowance_days: emp.allowance,
      region_code: 'DE' as string,
      active: true,
      color: emp.color
    }))

    const { data, error } = await supabase
      .from('employees')
      .insert(employeeInserts as any)
      .select()

    if (error) throw error

    console.log(`✅ Successfully saved ${data.length} employees to database`)
    return true
  } catch (error) {
    console.error('❌ Failed to save employees to database:', error)
    return false
  }
}

export const loadEmployeesFromDatabase = async (): Promise<StoredEmployee[]> => {
  try {
    console.log('🔄 Loading employees from database...')

    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) throw error

    // Calculate used/remaining from vacations
    const { data: vacations, error: vacationError } = await supabase
      .from('vacations')
      .select('employee_id, working_days')

    if (vacationError) throw vacationError

    // Convert database format to app format
    const result: StoredEmployee[] = (employees as any).map((emp: any) => {
      const empVacations = (vacations as any)?.filter((v: any) => v.employee_id === emp.id) || []
      const used = empVacations.reduce((sum: number, v: any) => sum + v.working_days, 0)

      return {
        id: emp.id,
        name: emp.name,
        allowance: emp.allowance_days,
        used: used,
        remaining: emp.allowance_days - used,
        color: emp.color || getEmployeeColor(emp.name)
      }
    })

    console.log(`✅ Successfully loaded ${result.length} employees from database`)
    return result
  } catch (error) {
    console.error('❌ Failed to load employees from database:', error)
    return getDefaultEmployees()
  }
}

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

// VACATION DATABASE OPERATIONS

export const saveVacationToDatabase = async (vacation: {
  employee_id: string
  start_date: string
  end_date: string
  working_days: number
  note?: string
}): Promise<{ success: boolean; vacation?: any }> => {
  try {
    console.log('🔄 Saving vacation to database...', vacation)

    const vacationInsert = {
      employee_id: vacation.employee_id,
      start_date: vacation.start_date,
      end_date: vacation.end_date,
      working_days: vacation.working_days,
      note: vacation.note || 'Urlaub (ganzer Tag)'
    }

    const { data, error } = await supabase
      .from('vacations')
      .insert(vacationInsert as any)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Successfully saved vacation to database:', data)
    return { success: true, vacation: data }
  } catch (error) {
    console.error('❌ Failed to save vacation to database:', error)
    return { success: false }
  }
}

export const loadVacationsFromDatabase = async (): Promise<StoredVacation[]> => {
  try {
    console.log('🔄 Loading vacations from database...')

    const { data: vacations, error } = await supabase
      .from('vacations')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) throw error

    // Convert database format to app format
    const result: StoredVacation[] = (vacations as any).map((v: any) => ({
      id: v.id,
      employee_id: v.employee_id,
      start_date: v.start_date,
      end_date: v.end_date,
      days: v.working_days,
      reason: v.note || 'Urlaub (ganzer Tag)',
      created_at: v.created_at || new Date().toISOString()
    }))

    console.log(`✅ Successfully loaded ${result.length} vacations from database`)
    return result
  } catch (error) {
    console.error('❌ Failed to load vacations from database:', error)
    return []
  }
}

export const deleteVacationFromDatabase = async (vacationId: string): Promise<boolean> => {
  try {
    console.log('🔄 Deleting vacation from database...', vacationId)

    const { error } = await supabase
      .from('vacations')
      .delete()
      .eq('id', vacationId)

    if (error) throw error

    console.log('✅ Successfully deleted vacation from database')
    return true
  } catch (error) {
    console.error('❌ Failed to delete vacation from database:', error)
    return false
  }
}

// UTILITY FUNCTIONS

export const getEmployeeColor = (name: string): string => {
  const index = name.charCodeAt(0) % DEFAULT_COLORS.length
  return DEFAULT_COLORS[index]
}

export const addVacationToDatabaseWithEmployeeUpdate = async (
  employeeId: string,
  vacationData: {
    startDate: string
    endDate: string
    days: number
    type?: string
    reason?: string
  }
): Promise<{ success: boolean; vacation?: any; employee?: StoredEmployee }> => {
  try {
    console.log('🔄 Adding vacation with employee update:', { employeeId, vacationData })

    // Save vacation to database
    const vacationResult = await saveVacationToDatabase({
      employee_id: employeeId,
      start_date: vacationData.startDate,
      end_date: vacationData.endDate,
      working_days: vacationData.days,
      note: vacationData.reason
    })

    if (!vacationResult.success) {
      return { success: false }
    }

    // Reload employee data (calculated from vacations)
    const employees = await loadEmployeesFromDatabase()
    const employee = employees.find(emp => emp.id === employeeId)

    console.log('✅ Vacation added and employee updated successfully')
    return {
      success: true,
      vacation: vacationResult.vacation,
      employee
    }
  } catch (error) {
    console.error('❌ Failed to add vacation with employee update:', error)
    return { success: false }
  }
}

// INITIALIZATION FUNCTIONS

export const initializeDatabaseFromLocalStorage = async (): Promise<void> => {
  try {
    // Only initialize if running in browser
    if (typeof window === 'undefined') return

    console.log('🔄 Initializing database from localStorage...')

    // Check if localStorage has data
    const localEmployees = localStorage.getItem('aboutwater-vacation-employees-2025')
    const localVacations = localStorage.getItem('aboutwater-vacation-entries-2025')

    if (localEmployees) {
      try {
        const employees = JSON.parse(localEmployees)
        console.log('🔄 Migrating employees from localStorage to database...')
        await saveEmployeesToDatabase(employees)
      } catch (error) {
        console.error('Failed to migrate employees:', error)
      }
    }

    if (localVacations) {
      try {
        const vacations = JSON.parse(localVacations)
        console.log('🔄 Migrating vacations from localStorage to database...')

        for (const vacation of vacations) {
          await saveVacationToDatabase({
            employee_id: vacation.employee_id,
            start_date: vacation.start_date,
            end_date: vacation.end_date,
            working_days: vacation.days,
            note: vacation.reason
          })
        }
      } catch (error) {
        console.error('Failed to migrate vacations:', error)
      }
    }

    console.log('✅ Database initialization completed')
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
  }
}

export const initializeDefaultEmployees = async (): Promise<void> => {
  try {
    console.log('🔄 Checking if default employees need to be created...')

    const employees = await loadEmployeesFromDatabase()

    if (employees.length === 0) {
      console.log('🔄 Creating default employees in database...')
      const defaultEmployees = getDefaultEmployees()
      await saveEmployeesToDatabase(defaultEmployees)
      console.log('✅ Default employees created in database')
    } else {
      console.log(`✅ Database already has ${employees.length} employees`)
    }
  } catch (error) {
    console.error('❌ Failed to initialize default employees:', error)
  }
}

// EXCEL IMPORT FUNCTIONS

export const importExcelToDatabase = async (file: File): Promise<{
  success: boolean
  employeesImported: number
  vacationsImported: number
  message: string
}> => {
  try {
    console.log('🔄 Starting Excel import to database...')

    // Dynamic import to avoid SSR issues
    const ExcelJS = (await import('exceljs')).default

    const workbook = new ExcelJS.Workbook()
    const arrayBuffer = await file.arrayBuffer()
    await workbook.xlsx.load(arrayBuffer)

    const employees: StoredEmployee[] = []
    const vacations: StoredVacation[] = []

    // Read Employee Summary sheet
    const summarySheet = workbook.getWorksheet('Mitarbeiter-Übersicht') ||
                        workbook.getWorksheet('Employee Summary')

    if (summarySheet) {
      console.log('📊 Processing employee summary sheet...')
      summarySheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header

        const values = row.values as any[]
        if (values[1]) { // If name exists
          employees.push({
            id: `imp_${Date.now()}_${rowNumber}`,
            name: values[1], // Employee name
            allowance: parseFloat(values[2]) || 25, // Allowed days
            used: parseFloat(values[3]) || 0, // Used days
            remaining: parseFloat(values[4]) || 25, // Remaining days
            color: values[6] || getEmployeeColor(values[1]) // Color
          })
        }
      })
    }

    // Read Vacation Entries sheet
    const vacationSheet = workbook.getWorksheet('Urlaubseinträge') ||
                         workbook.getWorksheet('Vacation Details')

    if (vacationSheet) {
      console.log('📊 Processing vacation entries sheet...')
      vacationSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Skip header

        const values = row.values as any[]
        if (values[1] && values[2] && values[3]) { // Name, Start, End required
          const employeeName = values[1]
          const employee = employees.find(emp => emp.name === employeeName)

          if (employee) {
            vacations.push({
              id: `vac_${Date.now()}_${rowNumber}`,
              employee_id: employee.id,
              start_date: values[2], // Start date
              end_date: values[3], // End date
              days: parseFloat(values[4]) || 1, // Days
              reason: values[5] || 'Urlaub (ganzer Tag)', // Type
              created_at: new Date().toISOString()
            })
          }
        }
      })
    }

    // Save imported data to database
    let employeesImported = 0
    let vacationsImported = 0

    if (employees.length > 0) {
      const success = await saveEmployeesToDatabase(employees)
      if (success) employeesImported = employees.length
    }

    if (vacations.length > 0) {
      for (const vacation of vacations) {
        const result = await saveVacationToDatabase({
          employee_id: vacation.employee_id,
          start_date: vacation.start_date,
          end_date: vacation.end_date,
          working_days: vacation.days,
          note: vacation.reason
        })
        if (result.success) vacationsImported++
      }
    }

    console.log(`✅ Excel import completed: ${employeesImported} employees, ${vacationsImported} vacations`)

    return {
      success: true,
      employeesImported,
      vacationsImported,
      message: `Erfolgreich importiert: ${employeesImported} Mitarbeiter und ${vacationsImported} Urlaubseinträge`
    }
  } catch (error) {
    console.error('❌ Excel import failed:', error)
    return {
      success: false,
      employeesImported: 0,
      vacationsImported: 0,
      message: `Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    }
  }
}

// EXCEL EXPORT FUNCTION WITH DATABASE DATA

export const generateExcelFromDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔄 Generating Excel from database...')

    // Dynamic import to avoid SSR issues
    const ExcelJS = (await import('exceljs')).default

    const employees = await loadEmployeesFromDatabase()
    const vacations = await loadVacationsFromDatabase()

    const workbook = new ExcelJS.Workbook()

    // Sheet 1: Mitarbeiter-Übersicht (Employee Summary)
    const summarySheet = workbook.addWorksheet('Mitarbeiter-Übersicht')
    summarySheet.columns = [
      { header: 'Mitarbeiter', key: 'name', width: 20 },
      { header: 'Erlaubte Tage', key: 'allowance', width: 15 },
      { header: 'Verbrauchte Tage', key: 'used', width: 15 },
      { header: 'Verbleibende Tage', key: 'remaining', width: 15 },
      { header: 'Verbrauch %', key: 'percentage', width: 15 },
      { header: 'Farbe', key: 'color', width: 10 }
    ]

    employees.forEach(employee => {
      const percentage = employee.allowance > 0 ? Math.round((employee.used / employee.allowance) * 100) : 0
      summarySheet.addRow({
        name: employee.name,
        allowance: employee.allowance,
        used: employee.used,
        remaining: employee.remaining,
        percentage: `${percentage}%`,
        color: employee.color
      })
    })

    // Sheet 2: Urlaubseinträge (Vacation Entries)
    const vacationSheet = workbook.addWorksheet('Urlaubseinträge')
    vacationSheet.columns = [
      { header: 'Mitarbeiter', key: 'employee', width: 20 },
      { header: 'Startdatum', key: 'startDate', width: 15 },
      { header: 'Enddatum', key: 'endDate', width: 15 },
      { header: 'Tage', key: 'days', width: 15 },
      { header: 'Typ', key: 'reason', width: 30 },
      { header: 'Erstellt', key: 'created', width: 20 }
    ]

    vacations.forEach(vacation => {
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

    // Format headers for both sheets
    const sheets = [summarySheet, vacationSheet]
    sheets.forEach(sheet => {
      sheet.getRow(1).font = { bold: true }
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1c5975' }
      }
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    })

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `AboutWater_Vacation_Export_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('✅ Excel export from database completed successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to generate Excel from database:', error)
    return false
  }
}