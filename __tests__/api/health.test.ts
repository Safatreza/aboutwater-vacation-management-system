import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

// Mock the database connection
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { version: '1.0.0' }, error: null })
  }
}))

// Mock process.env
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    GOOGLE_API_KEY: 'test-google-key',
    EMAIL_TO: 'test@aboutwater.de'
  }
})

afterEach(() => {
  process.env = originalEnv
  jest.clearAllMocks()
})

describe('/api/health', () => {
  test('returns healthy status with all services configured', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.data).toHaveProperty('status', 'healthy')
    expect(data.data).toHaveProperty('timestamp')
    expect(data.data).toHaveProperty('services')
    expect(data.data).toHaveProperty('version')
    expect(data.data).toHaveProperty('uptime')
    expect(data.requestId).toBeDefined()
  })

  test('includes service status information', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.data.services).toHaveProperty('database')
    expect(data.data.services).toHaveProperty('googleCalendar')
    expect(data.data.services).toHaveProperty('email')
    
    expect(data.data.services.database).toHaveProperty('status')
    expect(data.data.services.database).toHaveProperty('configured')
    
    expect(data.data.services.googleCalendar).toHaveProperty('status')
    expect(data.data.services.googleCalendar).toHaveProperty('configured')
    
    expect(data.data.services.email).toHaveProperty('status')
    expect(data.data.services.email).toHaveProperty('configured')
  })

  test('detects properly configured services', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.data.services.database.configured).toBe(true)
    expect(data.data.services.googleCalendar.configured).toBe(true)
    expect(data.data.services.email.configured).toBe(true)
  })

  test('detects unconfigured services', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined
    process.env.GOOGLE_API_KEY = undefined
    process.env.EMAIL_TO = undefined
    
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.data.services.database.configured).toBe(false)
    expect(data.data.services.googleCalendar.configured).toBe(false)
    expect(data.data.services.email.configured).toBe(false)
  })

  test('includes version information', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.data.version).toBeDefined()
    expect(typeof data.data.version).toBe('string')
  })

  test('includes uptime information', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.data.uptime).toBeDefined()
    expect(typeof data.data.uptime).toBe('number')
    expect(data.data.uptime).toBeGreaterThan(0)
  })

  test('includes request ID for tracking', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.requestId).toBeDefined()
    expect(typeof data.requestId).toBe('string')
    expect(data.requestId.length).toBeGreaterThan(10)
  })

  test('includes timestamp in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(data.data.timestamp).toBeDefined()
    const timestamp = new Date(data.data.timestamp)
    expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000) // Within last 5 seconds
  })

  test('handles database connection errors gracefully', async () => {
    // Mock database error
    const { supabase } = require('@/lib/supabase')
    supabase.single.mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
    
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200) // Still returns 200, but with error details
    expect(data.ok).toBe(true) // Health check doesn't fail on service errors
    expect(data.data.services.database.status).toContain('error')
  })

  test('response has correct content type', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  test('handles missing environment variables gracefully', async () => {
    process.env = {} // Clear all env vars
    
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.data.services.database.configured).toBe(false)
    expect(data.data.services.googleCalendar.configured).toBe(false)
    expect(data.data.services.email.configured).toBe(false)
  })
})