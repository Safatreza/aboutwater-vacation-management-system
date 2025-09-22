import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const timestamp = new Date().toISOString()
    const dataDir = path.join(process.cwd(), 'data')
    const vacationsFile = path.join(dataDir, 'vacations.json')
    const employeesFile = path.join(dataDir, 'employees.json')

    const testData = {
      message: 'API is working',
      timestamp,
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL === '1' ? 'Yes' : 'No',
      platform: process.platform,
      nodeVersion: process.version,
      workingDirectory: process.cwd(),
      fileSystem: {
        dataDir: {
          path: dataDir,
          exists: fs.existsSync(dataDir),
          canWrite: true // We'll test this
        },
        vacationsFile: {
          path: vacationsFile,
          exists: fs.existsSync(vacationsFile)
        },
        employeesFile: {
          path: employeesFile,
          exists: fs.existsSync(employeesFile)
        }
      }
    }

    // Test write permissions
    try {
      const testFile = path.join(dataDir, 'test-write.txt')
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      fs.writeFileSync(testFile, 'test')
      fs.unlinkSync(testFile)
      testData.fileSystem.dataDir.canWrite = true
    } catch (writeError) {
      testData.fileSystem.dataDir.canWrite = false
      testData.fileSystem.dataDir.writeError = writeError instanceof Error ? writeError.message : 'Unknown write error'
    }

    return NextResponse.json(testData)
  } catch (error) {
    return NextResponse.json({
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}