'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Loader2 } from 'lucide-react'

interface Holiday {
  id: string
  date: string
  name: string
  source: string
}

interface HolidayManagementProps {
  year: number
  onClose: () => void
  onUpdate: () => void
}

export default function HolidayManagement({ year, onClose, onUpdate }: HolidayManagementProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/holidays?region_code=DE&year=${year}`)
        const result = await response.json()
        
        if (!result.ok) {
          throw new Error(result.error || 'Failed to fetch holidays')
        }
        
        setHolidays(result.data || [])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error fetching holidays:', errorMessage)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchHolidays()
  }, [year])

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-0 border w-3/4 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-[#1c5975] mr-2" />
            <h3 className="text-lg font-medium text-gray-900 font-asap">Holiday Management - {year}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 font-asap mb-4">
            {year} German Public Holidays ({holidays.length})
          </h4>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1c5975]" />
              <span className="ml-2 text-sm text-gray-600 font-asap">Loading holidays...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-asap">
                ❌ Error loading holidays: {error}
              </p>
            </div>
          ) : holidays.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800 font-asap">
                ⚠️ No holidays found for {year}. Try syncing holidays using the "Sync Holidays" button.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {holidays.map((holiday) => (
                  <div key={holiday.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md bg-white">
                    <div>
                      <div className="text-sm font-medium text-gray-900 font-asap">{holiday.name}</div>
                      <div className="text-xs text-gray-500 font-asap">{holiday.date}</div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-asap capitalize">
                      {holiday.source}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-asap">
                  ✅ {holidays.length} German public holidays loaded for {year}. These will be excluded from working day calculations.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}