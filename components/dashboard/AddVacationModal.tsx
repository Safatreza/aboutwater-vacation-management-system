'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, AlertTriangle } from 'lucide-react'
import { addVacationToDb, getEmployees } from '@/lib/database'

interface AddVacationModalProps {
  employeeId: string
  year: number
  onClose: () => void
  onSuccess: () => void
}

export default function AddVacationModal({ employeeId, year, onClose, onSuccess }: AddVacationModalProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Get employee data for validation
  const [employee, setEmployee] = useState<any>(null)

  // Load employee data from REAL database
  useEffect(() => {
    getEmployees().then(employees => {
      const emp = employees.find(e => e.id === employeeId)
      setEmployee(emp)
    })
  }, [employeeId])

  // COMPREHENSIVE VALIDATION FUNCTION
  const validateForm = (): string[] => {
    const validationErrors: string[] = []

    // Check if dates are provided
    if (!startDate) validationErrors.push('Start date is required')
    if (!endDate) validationErrors.push('End date is required')

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Check date logic
      if (end < start) {
        validationErrors.push('End date must be after or equal to start date')
      }

      // Check if dates are in the past (warn but don't block)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (start < today) {
        validationErrors.push('Warning: Start date is in the past')
      }

      // Check if vacation is too long (more than 30 days)
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      if (dayCount > 30) {
        validationErrors.push('Warning: Vacation is longer than 30 days')
      }
      if (dayCount <= 0) {
        validationErrors.push('Vacation must be at least 1 day')
      }

      // Check employee's remaining vacation days
      if (employee) {
        const remainingDays = employee.remaining
        if (dayCount > remainingDays) {
          validationErrors.push(`Warning: This vacation (${dayCount} days) exceeds remaining vacation days (${remainingDays} days)`)
        }
      }
    }

    // Check employee exists
    if (!employee) {
      validationErrors.push('Employee not found')
    }

    return validationErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validate form
    const validationErrors = validateForm()
    const criticalErrors = validationErrors.filter(error =>
      !error.startsWith('Warning:') &&
      error !== 'Start date is in the past'
    )

    if (criticalErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    // Show warnings but allow to continue
    const warnings = validationErrors.filter(error => error.startsWith('Warning:'))
    if (warnings.length > 0) {
      const proceed = confirm(`The following warnings were found:\n\n${warnings.join('\n')}\n\nDo you want to continue?`)
      if (!proceed) {
        setErrors(validationErrors)
        return
      }
    }

    setLoading(true)

    try {
      // Calculate vacation days
      const dayCount = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1

      // CRITICAL FIX: Use REAL Supabase database for multi-user support
      const result = await addVacationToDb(employeeId, {
        startDate,
        endDate,
        days: dayCount,
        reason: note.trim() || 'Urlaub'
      })

      console.log('✅ Vacation saved successfully to REAL database:', result)

      // Show success message
      alert(`✅ Vacation added successfully to database!\nEmployee: ${employee?.name || 'Unknown'}\nPeriod: ${startDate} to ${endDate}\nDays: ${dayCount}\n\nData is now shared across all users!`)

      // Clear form
      setStartDate('')
      setEndDate('')
      setNote('')

      // Trigger parent refresh
      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`❌ Failed to add vacation: ${errorMessage}`)
      console.error('Error adding vacation:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-[#1c5975] mr-2" />
            <h3 className="text-lg font-medium text-gray-900 font-asap">Add Vacation</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 font-asap">Validation Issues:</h4>
                <ul className="mt-1 text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="font-asap">
                      {error.startsWith('Warning:') ? '⚠️ ' : '❌ '}
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Employee Info Display */}
        {employee && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800 font-asap">
              <strong>{employee.name}</strong> - Remaining: {employee.remaining} days ({employee.used}/{employee.allowance} used)
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-asap">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#1c5975] focus:border-[#1c5975] font-asap"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-asap">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#1c5975] focus:border-[#1c5975] font-asap"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 font-asap">Notes (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#1c5975] focus:border-[#1c5975] font-asap"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 font-asap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1c5975] hover:bg-[#164962] disabled:opacity-50 font-asap"
            >
              {loading ? 'Adding...' : 'Add Vacation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}