'use client'

import { useState } from 'react'
import { X, User } from 'lucide-react'

interface AddEmployeeModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddEmployeeModal({ onClose, onSuccess }: AddEmployeeModalProps) {
  const [name, setName] = useState('')
  const [allowanceDays, setAllowanceDays] = useState(25)
  const [region, setRegion] = useState('DE')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          allowance_days: allowanceDays,
          region_code: region
        })
      })
      
      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to create employee')
      }
      
      alert(`Employee ${name} added successfully!\nVacation Allowance: ${allowanceDays} days`)
      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to add employee: ${errorMessage}`)
      console.error('Error adding employee:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-[#1c5975] mr-2" />
            <h3 className="text-lg font-medium text-gray-900 font-asap">Add New Employee</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 font-asap">Employee Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#1c5975] focus:border-[#1c5975] font-asap"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 font-asap">Annual Vacation Allowance (Days) *</label>
            <input
              type="number"
              value={allowanceDays}
              onChange={(e) => setAllowanceDays(parseInt(e.target.value) || 0)}
              min="1"
              max="50"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#1c5975] focus:border-[#1c5975] font-asap"
              placeholder="25"
            />
            <p className="mt-1 text-sm text-gray-500 font-asap">Total vacation days allocated per year</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 font-asap">Region *</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#1c5975] focus:border-[#1c5975] font-asap"
            >
              <option value="DE">Germany (DE)</option>
              <option value="US">United States (US)</option>
              <option value="UK">United Kingdom (UK)</option>
              <option value="FR">France (FR)</option>
            </select>
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1c5975] hover:bg-[#164962] font-asap"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}