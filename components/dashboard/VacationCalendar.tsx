'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface Employee {
  employee_id: string
  employee_name: string
  color: string
}

interface VacationDay {
  employeeId: string
  employeeName: string
  date: string
  color: string
}

interface VacationCalendarProps {
  year: number
  employees: Employee[]
  vacations: VacationDay[]
}

export default function VacationCalendar({ year, employees, vacations }: VacationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(year)

  // German month names
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]

  // German day names
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

  // State for holidays fetched from API
  const [holidays, setHolidays] = useState<string[]>([])
  const [holidayNames, setHolidayNames] = useState<Record<string, string>>({})

  // Fetch holidays from API when year changes
  useEffect(() => {
    fetchHolidays(currentYear)
  }, [currentYear])

  const fetchHolidays = async (year: number) => {
    try {
      const response = await fetch(`/api/holidays?year=${year}`)
      const result = await response.json()

      if (result.ok && result.data) {
        const holidayDates = result.data.map((h: any) => h.date)
        const holidayNameMap = result.data.reduce((map: Record<string, string>, h: any) => {
          map[h.date] = h.name
          return map
        }, {})

        setHolidays(holidayDates)
        setHolidayNames(holidayNameMap)
      } else {
        // Fallback to basic German holidays if API fails
        const fallbackHolidays = [
          `${year}-01-01`, // Neujahr
          `${year}-05-01`, // Tag der Arbeit
          `${year}-10-03`, // Tag der Deutschen Einheit
          `${year}-12-25`, // Weihnachten
          `${year}-12-26`, // 2. Weihnachtstag
        ]
        setHolidays(fallbackHolidays)
        setHolidayNames({
          [`${year}-01-01`]: 'Neujahr',
          [`${year}-05-01`]: 'Tag der Arbeit',
          [`${year}-10-03`]: 'Tag der Deutschen Einheit',
          [`${year}-12-25`]: 'Weihnachten',
          [`${year}-12-26`]: '2. Weihnachtstag'
        })
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
      // Use fallback holidays
      const fallbackHolidays = [
        `${year}-01-01`, `${year}-05-01`, `${year}-10-03`,
        `${year}-12-25`, `${year}-12-26`
      ]
      setHolidays(fallbackHolidays)
    }
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatDate = (year: number, month: number, day: number) => {
    const monthStr = String(month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${year}-${monthStr}-${dayStr}`
  }

  const getVacationsForDate = (date: string) => {
    return vacations.filter(vacation => vacation.date === date)
  }

  const isHoliday = (date: string) => {
    return holidays.includes(date)
  }

  const getHolidayType = (date: string): 'feiertag' | 'ferien' | null => {
    if (!isHoliday(date)) return null

    const holidayName = holidayNames[date]
    if (!holidayName) return null

    // Check if it's a school break (Ferien)
    if (holidayName.includes('ferien') || holidayName.includes('Ferien') ||
        holidayName.includes('Buß-und Bettag')) {
      return 'ferien'
    }

    // Otherwise it's a public holiday (Feiertag)
    return 'feiertag'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(prev => prev - 1)
      } else {
        setCurrentMonth(prev => prev - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(prev => prev + 1)
      } else {
        setCurrentMonth(prev => prev + 1)
      }
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 border border-gray-200"></div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day)
      const dayVacations = getVacationsForDate(date)
      const isHolidayDate = isHoliday(date)
      const holidayType = getHolidayType(date)
      const isToday = date === new Date().toISOString().split('T')[0]

      // Determine background color based on holiday type
      let backgroundClass = ''
      let textClass = 'text-gray-900'

      if (isToday) {
        backgroundClass = 'bg-blue-50 border-blue-300'
      } else if (holidayType === 'feiertag') {
        backgroundClass = 'bg-red-50'
        textClass = 'text-red-600'
      } else if (holidayType === 'ferien') {
        backgroundClass = 'bg-blue-100'
        textClass = 'text-blue-600'
      }

      days.push(
        <div
          key={day}
          className={`h-20 border border-gray-200 p-1 relative ${backgroundClass}`}
        >
          <div className={`text-sm font-medium ${textClass}`}>
            {day}
          </div>

          {/* Holiday indicator */}
          {isHolidayDate && (
            <div
              className={`text-xs font-medium truncate ${
                holidayType === 'feiertag' ? 'text-red-600' : 'text-blue-600'
              }`}
              title={`${holidayNames[date] || 'Feiertag'} (${holidayType === 'feiertag' ? 'Feiertag' : 'Ferien'})`}
            >
              {holidayNames[date] || 'Feiertag'}
            </div>
          )}
          
          {/* Vacation indicators */}
          <div className="mt-1 space-y-0.5">
            {dayVacations.slice(0, 3).map((vacation, index) => (
              <div
                key={`${vacation.employeeId}-${index}`}
                className="text-xs px-1 py-0.5 rounded border text-white truncate shadow-sm"
                style={{
                  backgroundColor: vacation.color,
                  borderColor: vacation.color,
                  opacity: 0.9
                }}
                title={`${vacation.employeeName} - Urlaub`}
              >
                {vacation.employeeName}
              </div>
            ))}
            {dayVacations.length > 3 && (
              <div className="text-xs text-gray-600 font-medium bg-gray-100 px-1 py-0.5 rounded">
                +{dayVacations.length - 3} weitere
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-[#1c5975] mr-2" />
          <h2 className="text-xl font-bold text-gray-900 font-asap">
            Urlaubskalender {currentYear}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="text-lg font-semibold text-gray-900 font-asap min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Employee Color Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 font-asap mb-3">Mitarbeiter-Farbkodierung (Hochkontrast)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {employees.map(employee => (
            <div key={employee.employee_id} className="flex items-center bg-white px-3 py-2 rounded-md shadow-sm border border-gray-300">
              <div
                className="w-5 h-5 rounded mr-2 border-2 border-gray-400"
                style={{ backgroundColor: employee.color }}
              ></div>
              <span
                className="text-sm font-bold font-asap"
                style={{ color: employee.color }}
              >
                {employee.employee_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Day headers */}
        {dayNames.map(day => (
          <div
            key={day}
            className="h-10 border border-gray-200 bg-gray-50 flex items-center justify-center text-sm font-medium text-gray-900 font-asap"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {renderCalendar()}
      </div>

      {/* Calendar Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 font-asap mb-3">Kalender-Legende</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-asap">
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-red-50 border border-gray-300 mr-2 rounded"></span>
            <span className="text-red-600 font-medium">Feiertage</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-blue-100 border border-gray-300 mr-2 rounded"></span>
            <span className="text-blue-600 font-medium">Schulferien</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-4 h-4 bg-blue-50 border border-blue-300 mr-2 rounded"></span>
            <span className="text-blue-600 font-medium">Heute</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 rounded border border-gray-300" style={{ backgroundColor: '#FF0000' }}></div>
            <span className="text-gray-700 font-medium">Mitarbeiter Urlaub</span>
          </div>
        </div>
      </div>
    </div>
  )
}