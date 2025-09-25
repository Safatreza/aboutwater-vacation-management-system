// Pure Supabase Storage System
// Replaces hybridStorage.js with clean Supabase operations

import { supabase } from './supabase'
import type {
  Employee,
  EmployeeInsert,
  EmployeeUpdate,
  Vacation,
  VacationInsert,
  Holiday,
  HolidayInsert
} from '@/types/database'

// Employee Operations
export const employees = {
  async getAll(): Promise<Employee[]> {
    try {
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error

      // Calculate used vacation days for each employee from vacations table
      const currentYear = new Date().getFullYear()
      const employeesWithVacationData = await Promise.all(
        (employeesData || []).map(async (employee) => {
          // Get vacation days used this year
          const { data: vacations } = await supabase
            .from('vacations')
            .select('working_days')
            .eq('employee_id', employee.id)
            .gte('start_date', `${currentYear}-01-01`)
            .lte('end_date', `${currentYear}-12-31`)

          const usedVacationDays = vacations?.reduce((sum, vac) => sum + (vac.working_days || 0), 0) || 0

          return {
            ...employee,
            used_vacation_days: usedVacationDays,
            remaining_vacation: (employee.allowance_days || 25) - usedVacationDays
          }
        })
      )

      console.log(`📖 Loaded ${employeesWithVacationData.length} employees with calculated vacation data from Supabase`)
      return employeesWithVacationData
    } catch (error) {
      console.error('❌ Failed to fetch employees:', error)
      throw error
    }
  },

  async create(employee: EmployeeInsert): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Created employee: ${data.name}`)

      // Dispatch custom event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabaseUpdate', {
          detail: { table: 'employees', action: 'insert', data }
        }))
      }

      return data
    } catch (error) {
      console.error('❌ Failed to create employee:', error)
      throw error
    }
  },

  async update(id: string, updates: EmployeeUpdate): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      console.log(`✅ Updated employee: ${data.name}`)

      // Dispatch custom event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabaseUpdate', {
          detail: { table: 'employees', action: 'update', data }
        }))
      }

      return data
    } catch (error) {
      console.error('❌ Failed to update employee:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: false })
        .eq('id', id)

      if (error) throw error

      console.log(`✅ Deactivated employee: ${id}`)

      // Dispatch custom event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabaseUpdate', {
          detail: { table: 'employees', action: 'delete', id }
        }))
      }
    } catch (error) {
      console.error('❌ Failed to delete employee:', error)
      throw error
    }
  }
}

// Vacation Operations
export const vacations = {
  async getAll(): Promise<Vacation[]> {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('start_date', { ascending: false })

      if (error) throw error

      console.log(`📖 Loaded ${data.length} vacations from Supabase`)
      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch vacations:', error)
      throw error
    }
  },

  async getByEmployee(employeeId: string): Promise<Vacation[]> {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch employee vacations:', error)
      throw error
    }
  },

  async getByYear(year: number): Promise<Vacation[]> {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select(`
          *,
          employee:employees(*)
        `)
        .gte('start_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`)
        .order('start_date')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch vacations by year:', error)
      throw error
    }
  },

  async create(vacation: VacationInsert): Promise<Vacation> {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .insert(vacation)
        .select(`
          *,
          employee:employees(*)
        `)
        .single()

      if (error) throw error

      console.log(`✅ Created vacation for ${vacation.employee_id}: ${vacation.start_date} to ${vacation.end_date}`)

      // Update employee's used vacation days
      await this.updateEmployeeVacationDays(vacation.employee_id)

      // Dispatch custom event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabaseUpdate', {
          detail: { table: 'vacations', action: 'insert', data }
        }))
      }

      return data
    } catch (error) {
      console.error('❌ Failed to create vacation:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<VacationInsert>): Promise<Vacation> {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employee:employees(*)
        `)
        .single()

      if (error) throw error

      // Update employee's used vacation days
      await this.updateEmployeeVacationDays(data.employee_id)

      console.log(`✅ Updated vacation: ${id}`)

      // Dispatch custom event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabaseUpdate', {
          detail: { table: 'vacations', action: 'update', data }
        }))
      }

      return data
    } catch (error) {
      console.error('❌ Failed to update vacation:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Get vacation details before deletion for employee update
      const { data: vacation } = await supabase
        .from('vacations')
        .select('employee_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update employee's used vacation days
      if (vacation) {
        await this.updateEmployeeVacationDays(vacation.employee_id)
      }

      console.log(`✅ Deleted vacation: ${id}`)

      // Dispatch custom event for real-time updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('supabaseUpdate', {
          detail: { table: 'vacations', action: 'delete', id }
        }))
      }
    } catch (error) {
      console.error('❌ Failed to delete vacation:', error)
      throw error
    }
  },

  // Helper method to recalculate employee vacation days
  async updateEmployeeVacationDays(employeeId: string): Promise<void> {
    try {
      // Get all vacations for this employee in current year
      const currentYear = new Date().getFullYear()
      const { data: employeeVacations } = await supabase
        .from('vacations')
        .select('working_days')
        .eq('employee_id', employeeId)
        .gte('start_date', `${currentYear}-01-01`)
        .lte('end_date', `${currentYear}-12-31`)

      const totalUsedDays = employeeVacations?.reduce(
        (sum, vacation) => sum + (vacation.working_days || 0),
        0
      ) || 0

      // Update employee's used vacation days
      await supabase
        .from('employees')
        .update({ used_vacation_days: totalUsedDays })
        .eq('id', employeeId)

      console.log(`📊 Updated employee ${employeeId} used days: ${totalUsedDays}`)
    } catch (error) {
      console.error('❌ Failed to update employee vacation days:', error)
    }
  }
}

// Holiday Operations
export const holidays = {
  async getByRegionAndYear(regionCode: string, year: number): Promise<Holiday[]> {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('region_code', regionCode)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
        .order('date')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Failed to fetch holidays:', error)
      throw error
    }
  },

  async bulkInsert(holidays: HolidayInsert[]): Promise<Holiday[]> {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .upsert(holidays, {
          onConflict: 'region_code,date,name',
          ignoreDuplicates: true
        })
        .select()

      if (error) throw error

      console.log(`✅ Inserted/updated ${data?.length || 0} holidays`)
      return data || []
    } catch (error) {
      console.error('❌ Failed to bulk insert holidays:', error)
      throw error
    }
  }
}

// Settings Operations
export const settings = {
  async get(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single()

      if (error && error.code !== 'PGRST116') throw error // Ignore "not found" error

      return data?.value || null
    } catch (error) {
      console.error(`❌ Failed to get setting ${key}:`, error)
      return null
    }
  },

  async set(key: string, value: string, description?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          description: description || undefined
        })

      if (error) throw error

      console.log(`✅ Set setting: ${key} = ${value}`)
    } catch (error) {
      console.error(`❌ Failed to set setting ${key}:`, error)
      throw error
    }
  }
}

// Migration helper - import data from localStorage to Supabase
export const migration = {
  async importFromLocalStorage(): Promise<{ employees: number, vacations: number }> {
    if (typeof window === 'undefined') return { employees: 0, vacations: 0 }

    let importedEmployees = 0
    let importedVacations = 0

    try {
      // Import employees
      const storedEmployees = localStorage.getItem('aboutwater_employees')
      if (storedEmployees) {
        const employeesData = JSON.parse(storedEmployees)
        if (Array.isArray(employeesData)) {
          for (const emp of employeesData) {
            try {
              await employees.create({
                name: emp.name,
                allowance_days: emp.allowance || emp.allowance_days || 30,
                used_vacation_days: emp.used || emp.used_vacation_days || 0,
                region_code: emp.region_code || 'DE-BY',
                color: emp.color,
                active: emp.active !== false
              })
              importedEmployees++
            } catch (error) {
              console.warn(`Failed to import employee ${emp.name}:`, error)
            }
          }
        }
      }

      // Import vacations
      const storedVacations = localStorage.getItem('aboutwater_vacations')
      if (storedVacations) {
        const vacationsData = JSON.parse(storedVacations)
        if (Array.isArray(vacationsData)) {
          for (const vac of vacationsData) {
            try {
              await vacations.create({
                employee_id: vac.employee_id || vac.employeeId,
                start_date: vac.start_date || vac.startDate,
                end_date: vac.end_date || vac.endDate,
                working_days: vac.working_days || vac.workingDays || 1,
                note: vac.note
              })
              importedVacations++
            } catch (error) {
              console.warn(`Failed to import vacation:`, error)
            }
          }
        }
      }

      console.log(`✅ Migration complete: ${importedEmployees} employees, ${importedVacations} vacations`)
      return { employees: importedEmployees, vacations: importedVacations }
    } catch (error) {
      console.error('❌ Migration failed:', error)
      return { employees: importedEmployees, vacations: importedVacations }
    }
  }
}