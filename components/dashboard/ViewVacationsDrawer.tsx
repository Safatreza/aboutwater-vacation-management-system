'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Trash2 } from 'lucide-react'
import { getEmployeeVacations, getVacations, saveVacations, updateEmployeeUsage } from '@/lib/clientStorage'

interface Vacation {
  id: string
  start_date: string
  end_date: string
  working_days?: number
  days?: number
  note: string | null
  reason?: string
}

interface ViewVacationsDrawerProps {
  employeeId: string
  year: number
  onClose: () => void
  onUpdate: () => void
}

export default function ViewVacationsDrawer({ employeeId, year, onClose, onUpdate }: ViewVacationsDrawerProps) {
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVacations()
  }, [employeeId, year])

  const fetchVacations = async () => {
    try {
      setLoading(true)

      // CRITICAL FIX: Load from localStorage first (primary source)
      const localVacations = getEmployeeVacations(employeeId).filter(vacation => {
        const vacationYear = new Date(vacation.start_date).getFullYear()
        return vacationYear === year
      })

      console.log(`📖 Loaded ${localVacations.length} vacations for employee ${employeeId} from localStorage`)

      // Convert to expected format
      const formattedVacations: Vacation[] = localVacations.map(vacation => ({
        id: vacation.id,
        start_date: vacation.start_date,
        end_date: vacation.end_date,
        working_days: vacation.days,
        days: vacation.days,
        note: vacation.reason,
        reason: vacation.reason
      }))

      setVacations(formattedVacations)
      setError(null)

      // Also try to load from API (secondary source, don't fail if it doesn't work)
      try {
        const response = await fetch(`/api/vacations?employee_id=${employeeId}&year=${year}`)
        const result = await response.json()

        if (result.ok && result.data && result.data.length > 0) {
          console.log(`📖 Also found ${result.data.length} vacations from API`)
          // Could merge API data here if needed
        }
      } catch (apiError) {
        console.warn('API fetch failed (localStorage success):', apiError)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching vacations:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteVacation = async (vacationId: string) => {
    if (!confirm('Are you sure you want to delete this vacation?')) {
      return
    }

    try {
      // CRITICAL FIX: Delete from localStorage first
      const allVacations = getVacations()
      const vacationToDelete = allVacations.find(v => v.id === vacationId)

      if (!vacationToDelete) {
        throw new Error('Vacation not found in localStorage')
      }

      // Remove vacation from localStorage
      const updatedVacations = allVacations.filter(v => v.id !== vacationId)
      saveVacations(updatedVacations)

      // Update employee used days (subtract the deleted vacation days)
      updateEmployeeUsage(vacationToDelete.employee_id, -vacationToDelete.days)

      console.log('✅ Vacation deleted from localStorage:', vacationId)

      // Also try to delete from API (fallback - doesn't matter if it fails)
      try {
        await fetch(`/api/vacations/${vacationId}`, {
          method: 'DELETE'
        })
      } catch (apiError) {
        console.warn('API delete failed (localStorage success):', apiError)
      }

      alert('✅ Vacation deleted successfully')
      fetchVacations()
      onUpdate()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`❌ Failed to delete vacation: ${errorMessage}`)
      console.error('Error deleting vacation:', errorMessage)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-6 border-b">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-[#1c5975] mr-2" />
              <h3 className="text-lg font-medium text-gray-900 font-asap">Vacation History</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h5 className="text-sm font-medium text-gray-900 font-asap mb-4">
              Vacation Entries ({year})
            </h5>

            {loading && (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500 font-asap">Loading vacations...</div>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <div className="text-sm text-red-600 font-asap">Error: {error}</div>
              </div>
            )}

            {!loading && !error && vacations.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-sm text-gray-500 font-asap">No vacations found for {year}</div>
              </div>
            )}

            <div className="space-y-4">
              {vacations.map((vacation) => (
                <div key={vacation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 font-asap">
                        {vacation.start_date} - {vacation.end_date}
                      </div>
                      <div className="text-sm text-gray-600 mt-1 font-asap">
                        {vacation.working_days || vacation.days || 0} working days
                      </div>
                    </div>
                    <button
                      onClick={() => deleteVacation(vacation.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete vacation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {vacation.note && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded font-asap">
                      {vacation.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}