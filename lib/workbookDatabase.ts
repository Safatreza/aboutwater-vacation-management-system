// Database layer for Workbook Parity System
// Handles storage and retrieval of workbook-compatible data

import { supabase } from './supabase'
import {
  HolidayRange,
  LeaveCode,
  Employee,
  EmployeeReport,
  EmployeeRange,
  VacationEntry,
  workbookParityEngine
} from './workbookParitySystem'

// ================================
// DATABASE OPERATIONS
// ================================

export class WorkbookDatabase {
  private static instance: WorkbookDatabase

  public static getInstance(): WorkbookDatabase {
    if (!WorkbookDatabase.instance) {
      WorkbookDatabase.instance = new WorkbookDatabase()
    }
    return WorkbookDatabase.instance
  }

  // ================================
  // HOLIDAY RANGES
  // ================================

  async getHolidayRanges(): Promise<HolidayRange[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('holiday_ranges')
        .select('*')
        .order('start_date') as { data: any[] | null, error: any }

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching holiday ranges:', error)
      return []
    }
  }

  async createHolidayRange(holiday: Omit<HolidayRange, 'id'>): Promise<HolidayRange | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('holiday_ranges')
        .insert([{
          name: holiday.name,
          start_date: holiday.start_date,
          end_date: holiday.end_date,
          category: holiday.category
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating holiday range:', error)
      return null
    }
  }

  // ================================
  // LEAVE CODES
  // ================================

  async getLeaveCodes(): Promise<LeaveCode[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('leave_codes')
        .select('*')
        .order('code') as { data: any[] | null, error: any }

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching leave codes:', error)
      return []
    }
  }

  async createLeaveCode(leaveCode: LeaveCode): Promise<LeaveCode | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('leave_codes')
        .insert([leaveCode])
        .select()
        .single() as { data: any | null, error: any }

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating leave code:', error)
      return null
    }
  }

  async updateLeaveCode(leaveCode: LeaveCode): Promise<LeaveCode | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('leave_codes')
        .update({
          description: leaveCode.description,
          value_vacation: leaveCode.value_vacation,
          value_comp: leaveCode.value_comp,
          value_special: leaveCode.value_special
        })
        .eq('code', leaveCode.code)
        .select()
        .single() as { data: any | null, error: any }

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating leave code:', error)
      return null
    }
  }

  // ================================
  // WORKBOOK EMPLOYEES
  // ================================

  async getWorkbookEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('workbook_employees')
        .select('*')
        .eq('active', true)
        .order('name') as { data: any[] | null, error: any }

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching workbook employees:', error)
      return []
    }
  }

  async createWorkbookEmployee(employee: Omit<Employee, 'id'>): Promise<Employee | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('workbook_employees')
        .insert([employee])
        .select()
        .single() as { data: any | null, error: any }

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating workbook employee:', error)
      return null
    }
  }

  async updateWorkbookEmployee(employee: Employee): Promise<Employee | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('workbook_employees')
        .update({
          name: employee.name,
          carryover_prev_year: employee.carryover_prev_year,
          allowance_current_year: employee.allowance_current_year,
          active: employee.active
        })
        .eq('id', employee.id)
        .select()
        .single() as { data: any | null, error: any }

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating workbook employee:', error)
      return null
    }
  }

  // ================================
  // EMPLOYEE DAILY CODES
  // ================================

  async getEmployeeDailyCodes(employeeId: string): Promise<string[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('employee_daily_codes')
        .select('day_index, code')
        .eq('employee_id', employeeId)
        .eq('year', 2025) as { data: any[] | null, error: any }

      if (error) throw error

      // Initialize array with empty strings for all 365 days
      const dailyCodes = new Array(365).fill('')

      // Fill in the codes we have
      data?.forEach(entry => {
        if (entry.day_index >= 0 && entry.day_index < 365) {
          dailyCodes[entry.day_index] = entry.code || ''
        }
      })

      return dailyCodes
    } catch (error) {
      console.error('Error fetching employee daily codes:', error)
      return new Array(365).fill('')
    }
  }

  async setEmployeeDailyCodes(employeeId: string, dailyCodes: string[]): Promise<boolean> {
    try {
      // Delete existing codes for this employee/year
      await (supabase as any)
        .from('employee_daily_codes')
        .delete()
        .eq('employee_id', employeeId)
        .eq('year', 2025)

      // Insert new codes (only non-empty ones)
      const codesToInsert = dailyCodes
        .map((code, index) => ({
          employee_id: employeeId,
          year: 2025,
          day_index: index,
          code: code || null
        }))
        .filter(entry => entry.code !== null && entry.code !== '')

      if (codesToInsert.length > 0) {
        const { error } = await (supabase as any)
          .from('employee_daily_codes')
          .insert(codesToInsert)

        if (error) throw error
      }

      return true
    } catch (error) {
      console.error('Error setting employee daily codes:', error)
      return false
    }
  }

  async setEmployeeCodeForDateRange(
    employeeId: string,
    code: string,
    startDate: string,
    endDate: string
  ): Promise<boolean> {
    const startIdx = workbookParityEngine.getIndexByDate(startDate)
    const endIdx = workbookParityEngine.getIndexByDate(endDate)

    if (startIdx === -1 || endIdx === -1) {
      console.error('Invalid date range for code setting')
      return false
    }

    try {
      // Get current codes
      const dailyCodes = await this.getEmployeeDailyCodes(employeeId)

      // Set codes for the range
      for (let i = startIdx; i <= endIdx; i++) {
        dailyCodes[i] = code
      }

      // Save back to database
      return await this.setEmployeeDailyCodes(employeeId, dailyCodes)
    } catch (error) {
      console.error('Error setting employee code for date range:', error)
      return false
    }
  }

  // ================================
  // REPORTS AND ANALYTICS
  // ================================

  async getEmployeeReport(employeeId: string): Promise<EmployeeReport | null> {
    try {
      const employees = await this.getWorkbookEmployees()
      const employee = employees.find(emp => emp.id === employeeId)

      if (!employee) {
        console.error('Employee not found:', employeeId)
        return null
      }

      const dailyCodes = await this.getEmployeeDailyCodes(employeeId)
      return workbookParityEngine.calculateEmployeeReport(employee, dailyCodes)
    } catch (error) {
      console.error('Error generating employee report:', error)
      return null
    }
  }

  async getAllEmployeeReports(): Promise<EmployeeReport[]> {
    try {
      const employees = await this.getWorkbookEmployees()
      const reports: EmployeeReport[] = []

      for (const employee of employees) {
        const dailyCodes = await this.getEmployeeDailyCodes(employee.id)
        const report = workbookParityEngine.calculateEmployeeReport(employee, dailyCodes)
        reports.push(report)
      }

      return reports
    } catch (error) {
      console.error('Error generating all employee reports:', error)
      return []
    }
  }

  // ================================
  // INITIALIZATION
  // ================================

  async initializeWorkbookData(): Promise<void> {
    try {
      console.log('Initializing workbook data...')

      // Initialize leave codes
      const existingCodes = await this.getLeaveCodes()
      if (existingCodes.length === 0) {
        console.log('Creating canonical leave codes...')

        for (const leaveCode of workbookParityEngine.getLeaveCode('U') ? [] : []) {
          await this.createLeaveCode(leaveCode)
        }

        // Create all canonical codes manually since getLeaveCode returns default
        const canonicalCodes = [
          { code: 'U',  description: 'Urlaub',           value_vacation: 1.0, value_comp: 0,   value_special: 0   },
          { code: 'U2', description: 'Halber Urlaub',    value_vacation: 0.5, value_comp: 0,   value_special: 0   },
          { code: 'G',  description: 'Gleittag',         value_vacation: 0,   value_comp: 1.0, value_special: 0   },
          { code: 'G2', description: 'Halber Gleittag',  value_vacation: 0,   value_comp: 0.5, value_special: 0   },
          { code: 'S',  description: 'Sondertag',        value_vacation: 0,   value_comp: 0,   value_special: 1.0 },
          { code: 'UU', description: 'Unbezahlter Urlaub', value_vacation: 0, value_comp: 0,   value_special: 1.0 }
        ]

        for (const code of canonicalCodes) {
          await this.createLeaveCode(code)
        }
      }

      // Load leave codes into engine
      const leaveCodes = await this.getLeaveCodes()
      leaveCodes.forEach(code => {
        workbookParityEngine.addLeaveCode(code)
      })

      // Initialize holiday flags
      const holidayRanges = await this.getHolidayRanges()
      workbookParityEngine.setHolidayFlags(holidayRanges)

      console.log('Workbook data initialization complete')
    } catch (error) {
      console.error('Error initializing workbook data:', error)
    }
  }
}

// Export singleton instance
export const workbookDatabase = WorkbookDatabase.getInstance()