// Mock Database layer for Workbook Parity System
// Uses in-memory storage instead of Supabase

export interface HolidayRange {
  id?: string
  name: string
  start_date: string
  end_date: string
  category: string
}

export interface LeaveCode {
  code: string
  description: string
  value_vacation: number
  value_comp: number
  value_special: number
}

export interface Employee {
  id: string
  name: string
  carryover_prev_year: number
  allowance_current_year: number
  active: boolean
}

export interface EmployeeReport {
  employee: Employee
  vacation_days_used: number
  comp_days_used: number
  special_days_used: number
  remaining_vacation: number
}

const mockLeaveCode: LeaveCode = {
  code: 'U',
  description: 'Urlaub',
  value_vacation: 1.0,
  value_comp: 0,
  value_special: 0
}

const mockWorkbookParityEngine = {
  getIndexByDate: () => 0,
  calculateEmployeeReport: (employee: Employee, dailyCodes: string[]) => ({
    employee,
    vacation_days_used: 0,
    comp_days_used: 0,
    special_days_used: 0,
    remaining_vacation: employee.allowance_current_year
  }),
  getLeaveCode: () => mockLeaveCode,
  addLeaveCode: () => {},
  setHolidayFlags: () => {}
}

// ================================
// MOCK DATABASE OPERATIONS
// ================================

export class WorkbookDatabase {
  private static instance: WorkbookDatabase

  public static getInstance(): WorkbookDatabase {
    if (!WorkbookDatabase.instance) {
      WorkbookDatabase.instance = new WorkbookDatabase()
    }
    return WorkbookDatabase.instance
  }

  // All methods return mock data or simple success responses
  async getHolidayRanges(): Promise<HolidayRange[]> {
    return []
  }

  async createHolidayRange(holiday: Omit<HolidayRange, 'id'>): Promise<HolidayRange | null> {
    return { ...holiday, id: Date.now().toString() }
  }

  async getLeaveCodes(): Promise<LeaveCode[]> {
    return [mockLeaveCode]
  }

  async createLeaveCode(leaveCode: LeaveCode): Promise<LeaveCode | null> {
    return leaveCode
  }

  async updateLeaveCode(leaveCode: LeaveCode): Promise<LeaveCode | null> {
    return leaveCode
  }

  async getWorkbookEmployees(): Promise<Employee[]> {
    return []
  }

  async createWorkbookEmployee(employee: Omit<Employee, 'id'>): Promise<Employee | null> {
    return { ...employee, id: Date.now().toString() }
  }

  async updateWorkbookEmployee(employee: Employee): Promise<Employee | null> {
    return employee
  }

  async getEmployeeDailyCodes(employeeId: string): Promise<string[]> {
    return new Array(365).fill('')
  }

  async setEmployeeDailyCodes(employeeId: string, dailyCodes: string[]): Promise<boolean> {
    return true
  }

  async setEmployeeCodeForDateRange(
    employeeId: string,
    code: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    return true
  }

  async getEmployeeReport(employeeId: string): Promise<EmployeeReport | null> {
    const mockEmployee: Employee = {
      id: employeeId,
      name: 'Mock Employee',
      carryover_prev_year: 0,
      allowance_current_year: 30,
      active: true
    }
    return mockWorkbookParityEngine.calculateEmployeeReport(mockEmployee, [])
  }

  async getAllEmployeeReports(): Promise<EmployeeReport[]> {
    return []
  }

  async initializeWorkbookData(): Promise<void> {
    console.log('✅ Mock: Workbook data initialization completed (in-memory)')
  }
}

// Export singleton instance
export const workbookDatabase = WorkbookDatabase.getInstance()