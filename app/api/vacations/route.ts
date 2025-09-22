import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File paths for shared storage
const dataDir = path.join(process.cwd(), 'data')
const vacationsFile = path.join(dataDir, 'vacations.json')
const employeesFile = path.join(dataDir, 'employees.json')

// Default employee data
const getDefaultEmployees = () => [
  { id: '1', name: 'Andreas Pöppe', allowance: 38.0, used: 28.5, remaining: 9.5, color: '#FF0000' },
  { id: '2', name: 'Anna Kropfitsch', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#0000FF' },
  { id: '3', name: 'Antonio Svagusa', allowance: 26.0, used: 24.0, remaining: 2.0, color: '#008000' },
  { id: '4', name: 'Carmen Berger', allowance: 40.0, used: 22.0, remaining: 18.0, color: '#FF8000' },
  { id: '5', name: 'Cengiz Kina', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#800080' },
  { id: '6', name: 'Christian Irrgang', allowance: 34.0, used: 28.0, remaining: 6.0, color: '#008080' },
  { id: '7', name: 'Daniel Hegemann', allowance: 32.0, used: 29.0, remaining: 3.0, color: '#8B4513' },
  { id: '8', name: 'Estaline Philander', allowance: 30.0, used: 22.0, remaining: 8.0, color: '#FF1493' },
  { id: '9', name: 'Farouk Chasan', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#000080' },
  { id: '10', name: 'Florian Gräf', allowance: 47.0, used: 27.0, remaining: 20.0, color: '#800000' },
  { id: '11', name: 'Giorgi Lomidze', allowance: 30.0, used: 0.0, remaining: 30.0, color: '#2F4F4F' },
  { id: '12', name: 'Hannes Kolm', allowance: 33.0, used: 24.0, remaining: 9.0, color: '#B22222' },
  { id: '13', name: 'Josefine Mättig', allowance: 29.0, used: 29.0, remaining: 0.0, color: '#228B22' },
  { id: '14', name: 'Matthias Herbst', allowance: 36.0, used: 23.0, remaining: 13.0, color: '#4B0082' },
  { id: '15', name: 'Max Sanktjohanser', allowance: 30.0, used: 23.0, remaining: 7.0, color: '#DC143C' },
  { id: '16', name: 'Michael Reiser', allowance: 20.0, used: 19.5, remaining: 0.5, color: '#00CED1' },
  { id: '17', name: 'Mihaela Abmayr', allowance: 27.0, used: 19.0, remaining: 8.0, color: '#FF6347' },
  { id: '18', name: 'Petra Gräf', allowance: 35.0, used: 21.0, remaining: 14.0, color: '#4682B4' },
  { id: '19', name: 'René Kühn', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#D2691E' },
  { id: '20', name: 'Safat Majumder', allowance: 30.0, used: 7.0, remaining: 23.0, color: '#FF4500' },
  { id: '21', name: 'Sönke Rocho', allowance: 41.0, used: 31.0, remaining: 10.0, color: '#8B008B' },
  { id: '22', name: 'Thierry Brunner', allowance: 37.0, used: 28.0, remaining: 9.0, color: '#556B2F' }
]

// Check if running on Vercel (read-only filesystem)
const isVercel = process.env.VERCEL === '1'

// GET /api/vacations - Get all vacations using shared file storage or in-memory for Vercel
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('📨 API GET /vacations - Starting request')

    // Check if running on Vercel - use in-memory storage
    if (isVercel) {
      console.log('🌐 Running on Vercel - using in-memory storage')
      const inMemoryVacations = (globalThis as any).__VACATIONS__ || []
      console.log(`📖 Loaded ${inMemoryVacations.length} vacations from in-memory storage`)
      return NextResponse.json(inMemoryVacations)
    }

    console.log('💾 Using local file storage')

    // Initialize files if needed
    if (!fs.existsSync(vacationsFile)) {
      fs.writeFileSync(vacationsFile, JSON.stringify([], null, 2))
    }

    // Read vacations from shared file
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    console.log(`📖 Loaded ${vacations.length} vacations from SHARED STORAGE`)

    return NextResponse.json(vacations)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching vacations'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/vacations - Create new vacation
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('📍 POST /api/vacations - Starting request')

    // Parse request body first
    const body = await req.json()
    console.log('📍 Received request body:', JSON.stringify(body, null, 2))

    // Check if running on Vercel (read-only filesystem) - use in-memory storage
    if (isVercel) {
      console.log('🌐 Running on Vercel - using in-memory storage for demo')

      // In-memory storage for Vercel (resets on each deployment)
      const inMemoryVacations = (globalThis as any).__VACATIONS__ || []
      const inMemoryEmployees = (globalThis as any).__EMPLOYEES__ || [...getDefaultEmployees()]

      // Validate required fields
      if (!body.employee_id || !body.start_date || !body.end_date || !body.days) {
        return NextResponse.json({
          error: 'Validation failed',
          details: ['employee_id', 'start_date', 'end_date', 'days'].filter(field => !body[field])
        }, { status: 400 })
      }

      const newVacation = {
        id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employee_id: body.employee_id,
        start_date: body.start_date,
        end_date: body.end_date,
        days: parseFloat(body.days.toString()),
        reason: body.reason || 'Urlaub (ganzer Tag)',
        created_at: new Date().toISOString()
      }

      inMemoryVacations.push(newVacation)
      ;(globalThis as any).__VACATIONS__ = inMemoryVacations

      // Update employee
      const employeeIndex = inMemoryEmployees.findIndex((emp: any) => emp.id === newVacation.employee_id)
      if (employeeIndex !== -1) {
        const employee = inMemoryEmployees[employeeIndex]
        employee.used = parseFloat(employee.used.toString()) + parseFloat(newVacation.days.toString())
        employee.remaining = parseFloat(employee.allowance.toString()) - employee.used
        ;(globalThis as any).__EMPLOYEES__ = inMemoryEmployees
        console.log(`📊 Updated employee ${employee.name}: used → ${employee.used}, remaining → ${employee.remaining}`)
      }

      console.log('✅ Successfully added vacation (Vercel in-memory)')
      return NextResponse.json({
        success: true,
        vacation: newVacation,
        employees: inMemoryEmployees,
        message: `Added ${newVacation.days} days vacation (Vercel in-memory demo)`
      })
    }

    // Body already parsed above for Vercel compatibility

    // Validate required fields with detailed feedback
    const validationErrors: string[] = []
    if (!body.employee_id) validationErrors.push('employee_id is required')
    if (!body.start_date) validationErrors.push('start_date is required')
    if (!body.end_date) validationErrors.push('end_date is required')
    if (!body.days && body.days !== 0) validationErrors.push('days is required')

    if (validationErrors.length > 0) {
      console.error('❌ Validation failed:', validationErrors)
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors,
        receivedBody: body
      }, { status: 400 })
    }

    console.log('📍 Setting up file paths')
    console.log('📍 Data directory:', dataDir)
    console.log('📍 Vacations file:', vacationsFile)
    console.log('📍 Employees file:', employeesFile)

    // Initialize directory with error handling
    try {
      if (!fs.existsSync(dataDir)) {
        console.log('📍 Creating data directory')
        fs.mkdirSync(dataDir, { recursive: true })
      }
    } catch (dirError) {
      console.error('❌ Failed to create data directory:', dirError)
      return NextResponse.json({
        error: 'Failed to create data directory',
        details: dirError instanceof Error ? dirError.message : 'Unknown directory error',
        path: dataDir
      }, { status: 500 })
    }

    // Initialize vacations file
    try {
      if (!fs.existsSync(vacationsFile)) {
        console.log('📍 Creating vacations file')
        fs.writeFileSync(vacationsFile, JSON.stringify([], null, 2), 'utf8')
      }
    } catch (vacError) {
      console.error('❌ Failed to create vacations file:', vacError)
      return NextResponse.json({
        error: 'Failed to create vacations file',
        details: vacError instanceof Error ? vacError.message : 'Unknown file error',
        path: vacationsFile
      }, { status: 500 })
    }

    // CRITICAL FIX: Initialize employees file with defaults instead of returning error
    try {
      if (!fs.existsSync(employeesFile)) {
        console.log('📍 Creating employees file with default data')
        const defaultEmployees = getDefaultEmployees()
        fs.writeFileSync(employeesFile, JSON.stringify(defaultEmployees, null, 2), 'utf8')
        console.log(`📍 Created employees file with ${defaultEmployees.length} default employees`)
      }
    } catch (empError) {
      console.error('❌ Failed to create employees file:', empError)
      return NextResponse.json({
        error: 'Failed to create employees file',
        details: empError instanceof Error ? empError.message : 'Unknown file error',
        path: employeesFile
      }, { status: 500 })
    }

    // Read current data with error handling
    let vacations, employees
    try {
      console.log('📍 Reading vacations file')
      const vacationsContent = fs.readFileSync(vacationsFile, 'utf8')
      vacations = JSON.parse(vacationsContent)
      console.log(`📍 Loaded ${vacations.length} existing vacations`)
    } catch (readVacError) {
      console.error('❌ Failed to read vacations file:', readVacError)
      return NextResponse.json({
        error: 'Failed to read vacations file',
        details: readVacError instanceof Error ? readVacError.message : 'Unknown read error',
        path: vacationsFile
      }, { status: 500 })
    }

    try {
      console.log('📍 Reading employees file')
      const employeesContent = fs.readFileSync(employeesFile, 'utf8')
      employees = JSON.parse(employeesContent)
      console.log(`📍 Loaded ${employees.length} employees`)
    } catch (readEmpError) {
      console.error('❌ Failed to read employees file:', readEmpError)
      return NextResponse.json({
        error: 'Failed to read employees file',
        details: readEmpError instanceof Error ? readEmpError.message : 'Unknown read error',
        path: employeesFile
      }, { status: 500 })
    }

    // Create new vacation with enhanced ID generation
    const newVacation = {
      id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employee_id: body.employee_id,
      start_date: body.start_date,
      end_date: body.end_date,
      days: parseFloat(body.days.toString()),
      reason: body.reason || 'Urlaub (ganzer Tag)',
      created_at: new Date().toISOString()
    }
    console.log('📍 Created new vacation:', newVacation)

    // Add to vacations array
    vacations.push(newVacation)
    console.log(`📍 Added vacation to array, total count: ${vacations.length}`)

    // Update employee used/remaining days with detailed logging
    const employeeIndex = employees.findIndex(emp => emp.id === newVacation.employee_id)
    console.log(`📍 Looking for employee ID: ${newVacation.employee_id}`)
    console.log(`📍 Found employee at index: ${employeeIndex}`)

    if (employeeIndex !== -1) {
      const employee = employees[employeeIndex]
      const oldUsed = employee.used
      const vacationDays = parseFloat(newVacation.days.toString())
      const allowance = parseFloat(employee.allowance.toString())

      console.log(`📍 Employee before update:`, employee)

      employee.used = parseFloat(employee.used.toString()) + vacationDays
      employee.remaining = allowance - employee.used

      console.log(`📍 Employee after update:`, employee)

      // Save updated employees with error handling
      try {
        fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2), 'utf8')
        console.log(`📊 Updated employee ${employee.name}: used ${oldUsed} → ${employee.used}, remaining: ${employee.remaining}`)
      } catch (saveEmpError) {
        console.error('❌ Failed to save employees file:', saveEmpError)
        return NextResponse.json({
          error: 'Failed to save updated employee data',
          details: saveEmpError instanceof Error ? saveEmpError.message : 'Unknown save error'
        }, { status: 500 })
      }
    } else {
      console.warn(`⚠️ Employee not found with ID: ${newVacation.employee_id}`)
      console.warn(`⚠️ Available employee IDs:`, employees.map(emp => emp.id))
    }

    // Save updated vacations with error handling
    try {
      fs.writeFileSync(vacationsFile, JSON.stringify(vacations, null, 2), 'utf8')
      console.log(`➕ Saved vacation file with ${vacations.length} total vacations`)
    } catch (saveVacError) {
      console.error('❌ Failed to save vacations file:', saveVacError)
      return NextResponse.json({
        error: 'Failed to save vacation data',
        details: saveVacError instanceof Error ? saveVacError.message : 'Unknown save error'
      }, { status: 500 })
    }

    console.log(`✅ Successfully added vacation: ${newVacation.days} days for employee ${newVacation.employee_id}`)

    return NextResponse.json({
      success: true,
      vacation: newVacation,
      employees: employees,
      message: `Added ${newVacation.days} days vacation for ${employees.find(emp => emp.id === newVacation.employee_id)?.name || 'Unknown Employee'}`
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating vacation'
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('❌ POST /api/vacations - Critical Error:', errorMessage)
    console.error('❌ Error stack:', errorStack)

    return NextResponse.json({
      error: 'Internal server error while creating vacation',
      details: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// DELETE /api/vacations - Delete vacation
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { id } = body

    console.log(`🗑️ Deleting vacation from shared storage: ${id}`)

    // Read current data
    const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'))
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))

    // Find vacation to delete
    const vacationIndex = vacations.findIndex(vac => vac.id === id)

    if (vacationIndex === -1) {
      return NextResponse.json({ error: 'Vacation not found' }, { status: 404 })
    }

    const deletedVacation = vacations[vacationIndex]
    vacations.splice(vacationIndex, 1)

    // Update employee used/remaining days
    const employeeIndex = employees.findIndex(emp => emp.id === deletedVacation.employee_id)

    if (employeeIndex !== -1) {
      const oldUsed = employees[employeeIndex].used
      employees[employeeIndex].used = parseFloat(employees[employeeIndex].used.toString()) - parseFloat(deletedVacation.days.toString())
      employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used

      // Save updated employees
      fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))
      console.log(`📊 Reverted employee ${employees[employeeIndex].name}: used ${oldUsed} → ${employees[employeeIndex].used}, remaining: ${employees[employeeIndex].remaining}`)
    }

    // Save updated vacations
    fs.writeFileSync(vacationsFile, JSON.stringify(vacations, null, 2))

    console.log(`🗑️ Deleted vacation: ${deletedVacation.id}`)

    return NextResponse.json({
      success: true,
      deletedVacation,
      employees: employees
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error deleting vacation'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}