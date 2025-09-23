// MOCK DATABASE OPERATIONS SYSTEM
// Uses in-memory storage instead of Supabase for simplicity

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

// MOCK EMPLOYEE DATABASE OPERATIONS

export const saveEmployeesToDatabase = async (employees: StoredEmployee[]): Promise<boolean> => {
  console.log('✅ Mock: Successfully saved employees (in-memory)')
  return true
}

export const loadEmployeesFromDatabase = async (): Promise<StoredEmployee[]> => {
  console.log('✅ Mock: Loading default employees (in-memory)')
  return getDefaultEmployees()
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

// MOCK VACATION DATABASE OPERATIONS

export const saveVacationToDatabase = async (vacation: {
  employee_id: string
  start_date: string
  end_date: string
  working_days: number
  note?: string
}): Promise<{ success: boolean; vacation?: any }> => {
  console.log('✅ Mock: Successfully saved vacation (in-memory)')

  const mockVacation = {
    id: `vac_${Date.now()}`,
    employee_id: vacation.employee_id,
    start_date: vacation.start_date,
    end_date: vacation.end_date,
    working_days: vacation.working_days,
    note: vacation.note || 'Urlaub (ganzer Tag)',
    created_at: new Date().toISOString()
  }

  return { success: true, vacation: mockVacation }
}

export const loadVacationsFromDatabase = async (): Promise<StoredVacation[]> => {
  console.log('✅ Mock: Loading vacations (in-memory)')
  return []
}

export const deleteVacationFromDatabase = async (vacationId: string): Promise<boolean> => {
  console.log('✅ Mock: Successfully deleted vacation (in-memory)')
  return true
}

// UTILITY FUNCTIONS

export const getEmployeeColor = (name: string): string => {
  const index = name.charCodeAt(0) % DEFAULT_COLORS.length
  return DEFAULT_COLORS[index]
}

// MOCK FUNCTIONS - Simplified versions

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
  console.log('✅ Mock: Successfully added vacation and updated employee (in-memory)')

  const employees = getDefaultEmployees()
  const employee = employees.find(emp => emp.id === employeeId)

  return {
    success: true,
    vacation: {
      id: `vac_${Date.now()}`,
      employee_id: employeeId,
      start_date: vacationData.startDate,
      end_date: vacationData.endDate,
      days: vacationData.days,
      reason: vacationData.reason || 'Urlaub (ganzer Tag)',
      created_at: new Date().toISOString()
    },
    employee
  }
}

export const initializeDatabaseFromLocalStorage = async (): Promise<void> => {
  console.log('✅ Mock: Database initialization skipped (using in-memory storage)')
}

export const initializeDefaultEmployees = async (): Promise<void> => {
  console.log('✅ Mock: Default employees already available (in-memory)')
}

export const importExcelToDatabase = async (file: File): Promise<{
  success: boolean
  employeesImported: number
  vacationsImported: number
  message: string
}> => {
  try {
    console.log('🔄 Starting Excel import for in-memory API...')

    // Dynamic import to avoid SSR issues
    const ExcelJS = (await import('exceljs')).default;

    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);

    let employeesImported = 0;
    let vacationsImported = 0;

    // Import employees if sheet exists
    const employeeSheet = workbook.getWorksheet('Mitarbeiter-Übersicht');
    if (employeeSheet) {
      console.log('📋 Processing employees sheet...');

      employeeSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const name = row.getCell(1).text;
        const allowance = parseFloat(row.getCell(2).value?.toString() || '0');
        const used = parseFloat(row.getCell(3).value?.toString() || '0');
        const color = row.getCell(6).text || '#1c5975';

        if (name && allowance >= 0) {
          // For in-memory storage, we don't actually persist employee changes
          // since they're hardcoded in the API. Just count them.
          employeesImported++;
        }
      });
    }

    // Import vacations if sheet exists
    const vacationSheet = workbook.getWorksheet('Urlaubseinträge');
    if (vacationSheet) {
      console.log('📋 Processing vacation entries sheet...');

      // Get current employees to match names
      const employeesResponse = await fetch('/api/employees');
      const employees = await employeesResponse.json();

      for (let rowNumber = 2; rowNumber <= vacationSheet.rowCount; rowNumber++) {
        const row = vacationSheet.getRow(rowNumber);

        const employeeName = row.getCell(1).text;
        const startDate = row.getCell(2).text;
        const endDate = row.getCell(3).text;
        const days = parseFloat(row.getCell(4).value?.toString() || '0');
        const reason = row.getCell(5).text || 'Urlaub (ganzer Tag)';

        if (employeeName && startDate && endDate && days > 0) {
          // Find employee by name
          const employee = employees.find((emp: any) => emp.name === employeeName);

          if (employee) {
            try {
              // Add vacation via API
              const response = await fetch('/api/vacations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  employee_id: employee.id,
                  start_date: startDate,
                  end_date: endDate,
                  days: days,
                  reason: reason
                })
              });

              const result = await response.json();
              if (result.success) {
                vacationsImported++;
              }
            } catch (error) {
              console.error('Failed to import vacation:', error);
            }
          }
        }
      }
    }

    console.log(`✅ Excel import completed: ${employeesImported} employees, ${vacationsImported} vacations`);

    return {
      success: true,
      employeesImported,
      vacationsImported,
      message: `Import erfolgreich abgeschlossen. ${employeesImported} Mitarbeiter und ${vacationsImported} Urlaubseinträge verarbeitet.`
    };

  } catch (error) {
    console.error('❌ Excel import failed:', error);
    return {
      success: false,
      employeesImported: 0,
      vacationsImported: 0,
      message: `Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    };
  }
}

export const generateExcelFromDatabase = async (): Promise<boolean> => {
  console.log('✅ Mock: Excel export not implemented for in-memory storage')
  return false
}