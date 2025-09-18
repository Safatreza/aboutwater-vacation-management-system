'use client'

import { useState } from 'react'
import { X, Calendar } from 'lucide-react'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be after start date')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/vacations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          start_date: startDate,
          end_date: endDate,
          note: note.trim() || null
        })
      })

      const result = await response.json()

      if (!result.ok) {
        throw new Error(result.error || 'Failed to create vacation')
      }

      const vacation = result.data
      const dayCount = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1

      alert(`Vacation added successfully!\nPeriod: ${startDate} to ${endDate}\nDays: ${dayCount}`)
      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to add vacation: ${errorMessage}`)
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