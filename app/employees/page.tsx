'use client'

import { useState, useEffect } from 'react'
import AboutWaterHeader from '@/components/layout/AboutWaterHeader'
import AddEmployeeModal from '@/components/dashboard/AddEmployeeModal'
import EditableNumber from '@/components/ui/EditableNumber'
import { Users, Plus, Trash2, Calendar, Clock } from 'lucide-react'

interface Employee {
  id: string
  name: string
  allowance_days: number
  region_code: string
  active: boolean
  created_at: string
}

interface EmployeeSummary {
  employee_id: string
  employee_name: string
  vacation_allowance: number
  used_days: number
  remaining_days: number
  employee_region: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeSummaries, setEmployeeSummaries] = useState<EmployeeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch employees
      const empResponse = await fetch('/api/employees')
      const empResult = await empResponse.json()
      if (empResult.ok) {
        setEmployees(empResult.data || [])
      }

      // Fetch employee summaries
      const summaryResponse = await fetch(`/api/employees/summary?year=${selectedYear}`)
      const summaryResult = await summaryResponse.json()
      if (summaryResult.ok) {
        setEmployeeSummaries(summaryResult.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = () => {
    setShowAddModal(false)
    fetchData() // Refresh data after adding
  }

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Sind Sie sicher, dass Sie ${employeeName} löschen möchten?`)) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.ok) {
        alert(`Mitarbeiter ${employeeName} wurde erfolgreich gelöscht.`)
        fetchData() // Refresh data
      } else {
        alert(`Fehler beim Löschen: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Fehler beim Löschen des Mitarbeiters.')
    }
  }

  const handleUpdateAllowance = async (employeeId: string, newAllowance: number) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          allowance_days: newAllowance
        })
      })

      const result = await response.json()

      if (result.ok) {
        // Refresh data to show updated calculations
        fetchData()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating allowance:', error)
      alert('Fehler beim Aktualisieren des Urlaubskontingents.')
      throw error // Re-throw to let EditableNumber handle the error
    }
  }

  const getSummaryForEmployee = (employeeId: string) => {
    return employeeSummaries.find(summary => summary.employee_id === employeeId)
  }

  return (
    <div className="min-h-screen bg-transparent">
      <AboutWaterHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-8 w-8 text-[#1c5975]" />
              <h1 className="text-3xl font-bold text-[#1c5975] font-asap">
                Mitarbeiterverwaltung
              </h1>
            </div>
            <p className="text-gray-600 font-asap">
              Verwalten Sie alle Mitarbeiter und deren Urlaubskontingente
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-aboutwater flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Mitarbeiter hinzufügen</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c5975]"></div>
            <span className="ml-3 text-lg text-gray-600 font-asap">Lade Mitarbeiter...</span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-asap">Aktive Mitarbeiter</p>
                    <p className="text-3xl font-bold text-[#1c5975] font-asap">{employees.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-[#1c5975]" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-asap">Gesamt Urlaubstage</p>
                    <p className="text-3xl font-bold text-green-600 font-asap">
                      {employeeSummaries.reduce((total, summary) => total + summary.vacation_allowance, 0)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-asap">Verbrauchte Tage</p>
                    <p className="text-3xl font-bold text-orange-600 font-asap">
                      {employeeSummaries.reduce((total, summary) => total + summary.used_days, 0)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 font-asap">Verfügbare Tage</p>
                    <p className="text-3xl font-bold text-blue-600 font-asap">
                      {employeeSummaries.reduce((total, summary) => total + summary.remaining_days, 0)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-[#1c5975] font-asap">
                  Mitarbeiterliste ({selectedYear})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Mitarbeiter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Region
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Jahresurlaub
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Verbraucht
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Verfügbar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Beigetreten
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-asap">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => {
                      const summary = getSummaryForEmployee(employee.id)
                      return (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 font-asap">
                              {employee.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 font-asap">
                              {employee.region_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-asap">
                            <EditableNumber
                              value={summary?.vacation_allowance || employee.allowance_days}
                              onSave={(newValue) => handleUpdateAllowance(employee.id, newValue)}
                              min={1}
                              max={365}
                              suffix="Tage"
                              placeholder="Tage"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-asap">
                            <span className="text-orange-600 font-medium">
                              {summary?.used_days || 0} Tage
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-asap">
                            <span className="text-green-600 font-medium">
                              {summary?.remaining_days || employee.allowance_days} Tage
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-asap">
                            {new Date(employee.created_at).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              title="Mitarbeiter löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {employees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 font-asap">Keine Mitarbeiter gefunden</p>
                    <p className="text-gray-400 text-sm font-asap mt-1">
                      Fügen Sie Ihren ersten Mitarbeiter hinzu
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddEmployee}
        />
      )}
    </div>
  )
}