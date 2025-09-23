'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, Users, Trash2, RefreshCw } from 'lucide-react'
import { getEmployees, getVacations } from '@/lib/sharedStorage'

interface EmployeeSummary {
  employee_id: string
  employee_name: string
  vacation_allowance: number
  used_days: number
  remaining_days: number
  color?: string
}

interface EmployeeTableProps {
  year: number
  refreshKey: number
  onAddVacation: (employeeId: string) => void
  onViewVacations: (employeeId: string) => void
  onRefresh: () => void
}

export default function EmployeeTable({ 
  year, 
  refreshKey, 
  onAddVacation, 
  onViewVacations,
  onRefresh 
}: EmployeeTableProps) {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch employee summaries from shared storage API
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get data from shared storage API for consistency with AddVacationModal
      console.log('📡 EmployeeTable: Loading employees from shared storage API')
      const apiEmployees = await getEmployees()

      if (apiEmployees && apiEmployees.length > 0) {
        console.log(`📖 EmployeeTable: Loading ${apiEmployees.length} employees from shared storage`)

        // Convert API format to EmployeeTable format
        const employeeSummaries: EmployeeSummary[] = apiEmployees.map(emp => ({
          employee_id: emp.id,
          employee_name: emp.name,
          vacation_allowance: emp.allowance,
          used_days: emp.used,
          remaining_days: emp.remaining,
          color: emp.color
        }))

        setEmployees(employeeSummaries)
        setLoading(false)
        return
      }

      // FALLBACK: If API fails, try direct API endpoint
      console.log('📡 EmployeeTable: Falling back to direct API endpoint')
      const response = await fetch(`/api/employees`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const directEmployees = await response.json()
      const employeeSummaries: EmployeeSummary[] = directEmployees.map((emp: any) => ({
        employee_id: emp.id,
        employee_name: emp.name,
        vacation_allowance: emp.allowance,
        used_days: emp.used,
        remaining_days: emp.remaining,
        color: emp.color
      }))

      setEmployees(employeeSummaries)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching employees:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and when year/refreshKey changes
  useEffect(() => {
    fetchEmployees()
  }, [year, refreshKey])

  // Listen for refresh events for real-time updates
  useEffect(() => {
    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      console.log('🔄 EmployeeTable: Checking for API updates')
      fetchEmployees()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [year])

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to delete employee')
      }
      
      alert(result.data?.message || `Employee ${employeeName} has been deleted successfully.`)
      fetchEmployees() // Refresh the list
      onRefresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to delete employee: ${errorMessage}`)
      console.error('Error deleting employee:', errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1c5975] mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 font-asap">Loading employees...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 font-asap">
            Employee Vacation Summary
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 font-asap">
            Overview of vacation allowances and usage for all employees
          </p>
        </div>
        <div className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <p className="font-medium">Failed to load employees</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchEmployees}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1c5975] hover:bg-[#164962] font-asap"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 font-asap">
          Employee Vacation Summary
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 font-asap">
          Overview of vacation allowances and usage for all employees
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                Employee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                Yearly Allowance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                Used Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                Remaining Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                Usage %
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => {
              const usagePercentage = Math.round((employee.used_days / employee.vacation_allowance) * 100)
              const isHighUsage = usagePercentage > 80
              const isOverUsage = employee.remaining_days < 0
              
              return (
                <tr key={employee.employee_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-bold font-asap"
                      style={{ color: employee.color || '#374151' }}
                    >
                      {employee.employee_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-asap">
                      {employee.vacation_allowance} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-asap">
                      {employee.used_days} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium font-asap text-gray-900">
                      {employee.remaining_days} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium font-asap text-green-600">
                        {usagePercentage}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onAddVacation(employee.employee_id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#1c5975] hover:bg-[#164962] font-asap"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Vacation
                      </button>
                      <button
                        onClick={() => onViewVacations(employee.employee_id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 font-asap"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Vacations
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.employee_id, employee.employee_name)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 font-asap"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}