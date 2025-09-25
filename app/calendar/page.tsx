'use client'

import { useState, useEffect } from 'react'
import AboutWaterHeader from '@/components/layout/AboutWaterHeader'
import { Calendar, Users, CalendarDays } from 'lucide-react'
import { getEmployeeColorByName, getContrastColor } from '@/lib/employeeColors'
import { fetchEmployees, fetchVacations } from '@/lib/api'

interface Employee {
  id: string
  name: string
  allowance_days: number
  region_code: string
  active: boolean
}

interface Vacation {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  working_days: number
  note: string | null
}

interface Holiday {
  id: string
  date: string
  name: string
  region_code: string
  source: string
}

export default function CalendarPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear] = useState(new Date().getFullYear())
  const [months, setMonths] = useState<Array<{
    name: string
    days: Array<{
      date: number
      dateString: string
      vacations: any[]
      holidays: any[]
      isWeekend: boolean
      isHoliday: boolean
    }>
  }>>([]);

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  // Set up periodic refresh for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Calendar: Checking for updates')
      fetchData()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [selectedYear])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Calendar: Fetching data from API...')

      // Fetch employees and vacations from API
      const [employeesData, vacationsData] = await Promise.all([
        fetchEmployees(),
        fetchVacations()
      ])

      console.log(`📖 Calendar: Loaded ${employeesData.length} employees and ${vacationsData.length} vacations`)

      // Convert API employees to calendar format
      const formattedEmployees: Employee[] = employeesData.map(emp => ({
        id: emp.id,
        name: emp.name,
        allowance_days: emp.allowance_days || 25,
        region_code: emp.region_code || 'DE',
        active: emp.active !== false
      }))

      setEmployees(formattedEmployees)

      // Filter vacations for the selected year
      const yearVacations: Vacation[] = vacationsData
        .filter(vacation => {
          const vacationYear = new Date(vacation.start_date).getFullYear()
          return vacationYear === selectedYear
        })
        .map(vacation => ({
          id: vacation.id,
          employee_id: vacation.employee_id,
          start_date: vacation.start_date,
          end_date: vacation.end_date,
          working_days: vacation.working_days || vacation.days,
          note: vacation.note || vacation.reason
        }))

      console.log(`📖 Calendar: Filtered to ${yearVacations.length} vacations for ${selectedYear}`)
      setVacations(yearVacations)

      // Fetch holidays
      try {
        const holidayResponse = await fetch(`/api/holidays?region_code=DE&year=${selectedYear}`)
        const holidayResult = await holidayResponse.json()

        if (holidayResult.ok && holidayResult.data) {
          setHolidays(holidayResult.data)
        }
      } catch (holidayError) {
        console.warn('Failed to fetch holidays:', holidayError)
      }

      // Generate calendar data
      const calendarMonths = await generateCalendarDays(yearVacations)
      setMonths(calendarMonths)

    } catch (error) {
      console.error('❌ Calendar: Error fetching data:', error)
      setEmployees([])
      setVacations([])
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? employee.name : 'Unknown Employee'
  }

  const generateCalendarDays = async (yearVacations: Vacation[] = vacations) => {
    const year = selectedYear
    const months = [] as Array<{
      name: string
      days: Array<{
        date: number
        dateString: string
        vacations: any[]
        holidays: any[]
        isWeekend: boolean
        isHoliday: boolean
      }>
    }>

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()

      const monthData = {
        name: firstDay.toLocaleDateString('de-DE', { month: 'long' }),
        days: [] as Array<{
          date: number
          dateString: string
          vacations: any[]
          holidays: any[]
          isWeekend: boolean
          isHoliday: boolean
        }>
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day)
        const dateString = currentDate.toISOString().split('T')[0]

        // Find vacations for this date
        const dayVacations = yearVacations.filter(vacation => {
          const startDate = new Date(vacation.start_date)
          const endDate = new Date(vacation.end_date)
          // Normalize dates to avoid timezone issues
          const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

          return currentDateOnly >= startDateOnly && currentDateOnly <= endDateOnly
        })

        // Find holidays for this date
        const dayHolidays = holidays.filter(holiday => holiday.date === dateString)
        const isHoliday = dayHolidays.length > 0

        monthData.days.push({
          date: day,
          dateString,
          vacations: dayVacations,
          holidays: dayHolidays,
          isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
          isHoliday
        })
      }

      months.push(monthData)
    }

    return months
  }


  return (
    <div className="min-h-screen bg-transparent">
      <AboutWaterHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="h-8 w-8 text-[#1c5975]" />
            <h1 className="text-3xl font-bold text-[#1c5975] font-asap">
              Urlaubskalender {selectedYear}
            </h1>
          </div>
          <p className="text-gray-600 font-asap">
            Übersicht aller Urlaubszeiten für das Jahr {selectedYear}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1c5975]"></div>
            <span className="ml-3 text-lg text-gray-600 font-asap">Lade Kalender...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {months.map((month, monthIndex) => (
              <div key={monthIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#1c5975] to-[#2a7da2] text-white px-4 py-3">
                  <h3 className="text-lg font-semibold font-asap">{month.name}</h3>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                      <div key={day} className="text-xs font-medium text-gray-500 text-center p-1 font-asap">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {month.days.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`
                          aspect-square flex flex-col items-center justify-start p-1 text-xs rounded
                          ${day.isWeekend ? 'bg-gray-100' : 'bg-white'}
                          ${day.isHoliday ? 'bg-red-50 border border-red-200' : ''}
                          ${day.vacations.length > 0 ? 'bg-blue-100 border border-blue-300' : ''}
                          ${day.isHoliday && day.vacations.length > 0 ? 'bg-purple-100 border border-purple-300' : ''}
                        `}
                      >
                        <span className={`
                          font-medium font-asap
                          ${day.isWeekend ? 'text-gray-500' : 'text-gray-900'}
                          ${day.isHoliday ? 'text-red-700' : ''}
                          ${day.vacations.length > 0 ? 'text-blue-800' : ''}
                          ${day.isHoliday && day.vacations.length > 0 ? 'text-purple-800' : ''}
                        `}>
                          {day.date}
                        </span>

                        {/* Holiday indicator */}
                        {day.isHoliday && (
                          <div className="text-[8px] text-red-700 font-medium font-asap truncate w-full text-center">
                            {day.holidays[0]?.name.split(' ')[0]}
                          </div>
                        )}

                        {day.vacations.length > 0 && (
                          <div className="mt-0.5 w-full">
                            {day.vacations.slice(0, 2).map((vacation, vacIndex) => {
                              const employeeName = getEmployeeName(vacation.employee_id)
                              const backgroundColor = getEmployeeColorByName(employeeName)
                              const textColor = getContrastColor(backgroundColor)

                              return (
                                <div
                                  key={vacIndex}
                                  className="text-[8px] px-1 py-0.5 rounded mb-0.5 truncate font-asap"
                                  style={{
                                    backgroundColor: backgroundColor,
                                    color: textColor
                                  }}
                                  title={`${employeeName}: ${vacation.start_date} - ${vacation.end_date}`}
                                >
                                  {employeeName.split(' ')[0]}
                                </div>
                              )
                            })}
                            {day.vacations.length > 2 && (
                              <div className="text-[8px] text-[#1c5975] font-medium font-asap">
                                +{day.vacations.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarDays className="h-5 w-5 text-[#1c5975]" />
            <h3 className="text-lg font-semibold text-[#1c5975] font-asap">
              Legende
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-600 font-asap">Feiertage</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-sm text-gray-600 font-asap">Wochenende</span>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4 text-[#1c5975]" />
              <span className="text-sm text-gray-600 font-asap">
                {employees.length} Mitarbeiter aktiv
              </span>
            </div>
          </div>

          {/* Employee Color Legend */}
          <div className="mitarbeiter-farbkodierung">
            <h4 className="text-md font-semibold text-[#1c5975] font-asap mb-3">
              Mitarbeiter-Farbkodierung (Hochkontrast)
            </h4>
            <div className="color-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {employees.map(employee => {
                const color = getEmployeeColorByName(employee.name)
                return (
                  <div key={employee.id} className="legend-item flex items-center space-x-2">
                    <div
                      className="color-square w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span
                      className="employee-name text-sm font-asap truncate"
                      style={{ color: color }}
                      title={employee.name}
                    >
                      {employee.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}