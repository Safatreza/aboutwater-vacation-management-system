import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// File paths for shared storage
const dataDir = path.join(process.cwd(), 'data')
const employeesFile = path.join(dataDir, 'employees.json')

// Check if running on Vercel (read-only filesystem)
const isVercel = process.env.VERCEL === '1'

// Default AboutWater employees
const defaultEmployees = [
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

// Initialize files if they don't exist
function initializeFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log('✅ Created data directory')
  }

  if (!fs.existsSync(employeesFile)) {
    fs.writeFileSync(employeesFile, JSON.stringify(defaultEmployees, null, 2))
    console.log('✅ Initialized employees.json with default AboutWater data')
  }
}

// GET /api/employees - Get all employees using shared file storage or in-memory for Vercel
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('📨 API GET /employees - Starting request')

    // Check if running on Vercel - use in-memory storage
    if (isVercel) {
      console.log('🌐 Running on Vercel - using in-memory storage')
      const inMemoryEmployees = (globalThis as any).__EMPLOYEES__ || [...defaultEmployees]
      console.log(`📖 Loaded ${inMemoryEmployees.length} employees from in-memory storage`)
      return NextResponse.json(inMemoryEmployees)
    }

    console.log('💾 Using local file storage')

    // Initialize files if needed
    initializeFiles()

    // Read employees from shared file
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))
    console.log(`📖 Loaded ${employees.length} employees from SHARED STORAGE`)

    return NextResponse.json(employees)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching employees'
    console.error('❌ Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/employees - Create new employee
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    console.log('Creating employee:', { name: body.name, allowance: body.allowance })

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Employee name is required and cannot be empty' }, { status: 400 })
    }

    if (!body.allowance || body.allowance < 1 || body.allowance > 50) {
      return NextResponse.json({ error: 'Allowance days must be between 1 and 50' }, { status: 400 })
    }

    // Initialize files
    initializeFiles()

    // Read current employees
    const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'))

    // Create new employee
    const newEmployee = {
      id: `emp_${Date.now()}`,
      name: body.name.trim(),
      allowance: body.allowance,
      used: 0,
      remaining: body.allowance,
      color: body.color || '#1c5975'
    }

    // Add to employees array
    employees.push(newEmployee)

    // Save back to file
    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))

    console.log(`Successfully created employee with ID: ${newEmployee.id}`)

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating employee'
    console.error('Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT /api/employees - Update employees
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const employees = await req.json()

    console.log('Updating employees:', employees.length)

    // Initialize files
    initializeFiles()

    // Save employees to file
    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2))

    console.log(`Successfully saved ${employees.length} employees`)

    return NextResponse.json({ success: true })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error updating employees'
    console.error('Error:', errorMessage)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}