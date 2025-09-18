'use client'

import { useState, useEffect } from 'react'
import { LogOut, Plus, Users, Calendar, Download, RefreshCw, Database, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
// import { useAuth } from '@/components/auth/AuthProvider'
import Image from 'next/image'
import AboutWaterHeader from '../layout/AboutWaterHeader'
import EmployeeTable from './EmployeeTable'
import AddEmployeeModal from './AddEmployeeModal'
import AddVacationModal from './AddVacationModal'
import ViewVacationsDrawer from './ViewVacationsDrawer'
import HolidayManagement from './HolidayManagement'
import VacationCalendar from './VacationCalendar'

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const router = useRouter()
  // const { logout } = useAuth() // Commented out
  
  // Modal states
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showAddVacation, setShowAddVacation] = useState(false)
  const [showViewVacations, setShowViewVacations] = useState(false)
  const [showHolidays, setShowHolidays] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  
  // System state
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  // Dynamic employee and vacation data from API
  const [employees, setEmployees] = useState<any[]>([])
  const [vacations, setVacations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Default color palette for employees without assigned colors
  const defaultEmployeeColors = [
    '#1c5975', '#2a7da2', '#0ea5e9', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#059669',
    '#DC2626', '#7C3AED', '#DB2777', '#374151', '#047857'
  ]

  // Fetch employees and vacations data
  useEffect(() => {
    fetchEmployeesAndVacations()
  }, [selectedYear, refreshKey])

  const fetchEmployeesAndVacations = async () => {
    setLoading(true)
    try {
      // Fetch employees
      const employeesResponse = await fetch('/api/employees')
      const employeesResult = await employeesResponse.json()
      
      if (employeesResult.ok) {
        const employeesWithColors = (employeesResult.data || []).map((emp: any, index: number) => ({
          ...emp,
          color: emp.color || defaultEmployeeColors[index % defaultEmployeeColors.length]
        }))
        setEmployees(employeesWithColors)
        
        // Fetch vacations for all employees
        const vacationPromises = employeesWithColors.map(async (emp: any) => {
          const vacationsResponse = await fetch(`/api/vacations?employee_id=${emp.id}&year=${selectedYear}`)
          const vacationsResult = await vacationsResponse.json()
          
          if (vacationsResult.ok) {
            return (vacationsResult.data || []).map((vacation: any) => ({
              ...vacation,
              employeeName: emp.name,
              color: emp.color,
              dates: generateDateRange(vacation.start_date, vacation.end_date)
            }))
          }
          return []
        })
        
        const allVacations = await Promise.all(vacationPromises)
        const flattenedVacations = allVacations.flat()
        
        // Convert vacation ranges to individual dates for calendar display
        const vacationDates = flattenedVacations.flatMap((vacation: any) => 
          vacation.dates?.map((date: string) => ({
            employeeId: vacation.employee_id,
            employeeName: vacation.employeeName,
            date: date,
            color: vacation.color,
            type: vacation.type || 'vacation',
            status: vacation.status || 'approved'
          })) || []
        )
        
        setVacations(vacationDates)
      } else {
        console.error('Failed to fetch employees:', employeesResult.error)
        setEmployees([])
        setVacations([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setEmployees([])
      setVacations([])
    } finally {
      setLoading(false)
    }
  }

  // Helper function to generate date range
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    const dates = []
    const current = new Date(startDate)
    const end = new Date(endDate)
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }

  const handleSignOut = async () => {
    // logout() // Commented out for now
    router.push('/')
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    fetchEmployeesAndVacations() // Also refresh calendar data
  }

  const handleSyncHolidays = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/holidays/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: selectedYear,
          region_code: 'DE'
        })
      })
      
      const result = await response.json()
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to sync holidays')
      }
      
      const { synced, total } = result.data
      if (synced > 0) {
        alert(`Successfully synced ${synced} new German holidays for ${selectedYear}!\nTotal holidays: ${total}`)
      } else {
        alert(`All German holidays for ${selectedYear} are already up to date.\nTotal holidays: ${total}`)
      }
      
      handleRefresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Holiday sync failed:', errorMessage)
      alert(`Failed to sync holidays: ${errorMessage}`)
    } finally {
      setSyncing(false)
    }
  }

  const handleAddVacation = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setShowAddVacation(true)
  }

  const handleViewVacations = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setShowViewVacations(true)
  }

  const handleManualBackup = async () => {
    setBackingUp(true)
    try {
      const response = await fetch('/api/backup', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('Backup completed successfully! The data has been sent to safat.majumder@aboutwater.de')
      } else {
        alert('Backup failed: ' + result.message)
      }
    } catch (error) {
      alert('Backup failed: Network error')
      console.error('Backup error:', error)
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <AboutWaterHeader />
      {/* Dashboard Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left side - Title and Year Selector */}
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-2xl font-bold text-aboutwater-primary">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Urlaubsübersicht für Mitarbeiter</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="label-aboutwater mb-0">Jahr:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="input-aboutwater w-24 py-1.5"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() + i - 1
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualBackup}
                disabled={backingUp}
                className="btn-aboutwater-outline disabled:opacity-50"
              >
                <Database className={`h-4 w-4 mr-2 ${backingUp ? 'animate-pulse' : ''}`} />
                {backingUp ? 'Sicherung läuft...' : 'Backup'}
              </button>

              <button
                onClick={handleSyncHolidays}
                disabled={syncing}
                className="btn-aboutwater-outline disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sync...' : 'Feiertage'}
              </button>
              
              <button
                onClick={() => setShowHolidays(true)}
                className="btn-aboutwater-ghost"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Feiertage
              </button>

              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className={showCalendar ? 'btn-aboutwater' : 'btn-aboutwater-ghost'}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showCalendar ? 'Kalender ausblenden' : 'Kalender'}
              </button>
              
              <button
                onClick={() => setShowAddEmployee(true)}
                className="btn-aboutwater"
              >
                <Plus className="h-4 w-4 mr-2" />
                Mitarbeiter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 font-asap">Employee Vacation Overview - {selectedYear}</h2>
            <p className="mt-2 text-lg text-gray-600 font-asap">
              Manage employee vacation allowances and track usage
            </p>
          </div>

          {/* Calendar View */}
          {showCalendar && (
            <div className="mb-8">
              {loading ? (
                <div className="card-aboutwater p-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-aboutwater-primary animate-spin mr-3" />
                    <span className="text-lg text-gray-600">Lade Kalender-Daten...</span>
                  </div>
                </div>
              ) : (
                <VacationCalendar
                  year={selectedYear}
                  employees={employees}
                  vacations={vacations}
                />
              )}
            </div>
          )}

          {/* Employee Table */}
          <EmployeeTable
            year={selectedYear}
            refreshKey={refreshKey}
            onAddVacation={handleAddVacation}
            onViewVacations={handleViewVacations}
            onRefresh={handleRefresh}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#1c5975] text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <p className="text-sm font-asap">
              © 2024 aboutwater GmbH. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals and Drawers */}
      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSuccess={handleRefresh}
        />
      )}
      
      {showAddVacation && selectedEmployeeId && (
        <AddVacationModal
          employeeId={selectedEmployeeId}
          year={selectedYear}
          onClose={() => {
            setShowAddVacation(false)
            setSelectedEmployeeId(null)
          }}
          onSuccess={handleRefresh}
        />
      )}
      
      {showViewVacations && selectedEmployeeId && (
        <ViewVacationsDrawer
          employeeId={selectedEmployeeId}
          year={selectedYear}
          onClose={() => {
            setShowViewVacations(false)
            setSelectedEmployeeId(null)
          }}
          onUpdate={handleRefresh}
        />
      )}
      
      {showHolidays && (
        <HolidayManagement
          year={selectedYear}
          onClose={() => setShowHolidays(false)}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  )
}
