export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          name: string
          allowance_days: number
          used_vacation_days?: number
          remaining_vacation?: number
          region_code: string
          active: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          allowance_days: number
          used_vacation_days?: number
          remaining_vacation?: number
          region_code?: string
          active?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          allowance_days?: number
          used_vacation_days?: number
          remaining_vacation?: number
          region_code?: string
          active?: boolean
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      vacations: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          working_days: number
          note?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          working_days: number
          note?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          working_days?: number
          note?: string
          created_at?: string
          updated_at?: string
        }
      }
      holidays: {
        Row: {
          id: string
          region_code: string
          date: string
          name: string
          source: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          region_code: string
          date: string
          name: string
          source: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region_code?: string
          date?: string
          name?: string
          source?: string
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          key: string
          value: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for the application
export type Employee = Database['public']['Tables']['employees']['Row']
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export type Vacation = Database['public']['Tables']['vacations']['Row']
export type VacationInsert = Database['public']['Tables']['vacations']['Insert']
export type VacationUpdate = Database['public']['Tables']['vacations']['Update']

export type Holiday = Database['public']['Tables']['holidays']['Row']
export type HolidayInsert = Database['public']['Tables']['holidays']['Insert']

// Extended types for UI
export interface EmployeeWithVacations extends Employee {
  vacations: Vacation[]
  usedDays?: number
  remainingDays?: number
}

export interface VacationWithEmployee extends Vacation {
  employee: Employee
}

// API Response types
export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  requestId?: string
}

// Working day calculation types
export interface WorkingDayCalculation {
  totalDays: number
  workingDays: number
  weekendDays: number
  holidayDays: number
  excludedDates: string[]
}