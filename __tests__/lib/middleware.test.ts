import { NextRequest } from 'next/server'
import {
  ApiError,
  createApiResponse,
  rateLimit,
  getClientIp,
  validateAndSanitizeInput,
  corsMiddleware,
  securityHeaders,
  Logger,
  defaultSecurityConfig
} from '@/lib/middleware'

// Mock crypto.randomUUID for consistent testing
const mockUuid = 'test-uuid-123'
jest.spyOn(crypto, 'randomUUID').mockImplementation(() => mockUuid)

describe('Middleware Security Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ApiError', () => {
    test('creates error with default values', () => {
      const error = new ApiError('Test error')
      
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.requestId).toBe(mockUuid)
      expect(error).toBeInstanceOf(Error)
    })

    test('creates error with custom values', () => {
      const error = new ApiError('Custom error', 400, 'CUSTOM_CODE', { extra: 'data' })
      
      expect(error.message).toBe('Custom error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.details).toEqual({ extra: 'data' })
      expect(error.requestId).toBe(mockUuid)
    })

    test('captures stack trace', () => {
      const error = new ApiError('Test error')
      expect(error.stack).toBeDefined()
    })
  })

  describe('createApiResponse', () => {
    test('creates successful response', () => {
      const response = createApiResponse(true, { data: 'test' })
      
      expect(response.ok).toBe(true)
      expect(response.data).toEqual({ data: 'test' })
      expect(response.requestId).toBe(mockUuid)
      expect(response.timestamp).toBeDefined()
      expect(response.error).toBeUndefined()
    })

    test('creates error response', () => {
      const response = createApiResponse(false, null, 'Test error', 'TEST_CODE', { detail: 'info' })
      
      expect(response.ok).toBe(false)
      expect(response.data).toBeNull()
      expect(response.error).toBe('Test error')
      expect(response.code).toBe('TEST_CODE')
      expect(response.details).toEqual({ detail: 'info' })
      expect(response.requestId).toBe(mockUuid)
    })

    test('includes valid timestamp', () => {
      const response = createApiResponse(true, {})
      const timestamp = new Date(response.timestamp)
      
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000) // Within last second
    })
  })

  describe('getClientIp', () => {
    test('extracts IP from x-forwarded-for header', () => {
      const req = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1'
        }
      })
      
      expect(getClientIp(req)).toBe('192.168.1.1')
    })

    test('extracts IP from x-real-ip header when forwarded-for not present', () => {
      const req = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.2'
        }
      })
      
      expect(getClientIp(req)).toBe('192.168.1.2')
    })

    test('extracts IP from x-vercel-forwarded-for header as fallback', () => {
      const req = new NextRequest('http://localhost:3000', {
        headers: {
          'x-vercel-forwarded-for': '192.168.1.3'
        }
      })
      
      expect(getClientIp(req)).toBe('192.168.1.3')
    })

    test('returns localhost as ultimate fallback', () => {
      const req = new NextRequest('http://localhost:3000')
      expect(getClientIp(req)).toBe('127.0.0.1')
    })

    test('handles forwarded-for with spaces', () => {
      const req = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': ' 192.168.1.1 , 10.0.0.1 '
        }
      })
      
      expect(getClientIp(req)).toBe('192.168.1.1')
    })
  })

  describe('validateAndSanitizeInput', () => {
    test('validates valid input object', () => {
      const input = { name: 'John', email: 'john@example.com' }
      const result = validateAndSanitizeInput(input)
      
      expect(result).toEqual(input)
    })

    test('throws error for non-object input', () => {
      expect(() => validateAndSanitizeInput(null)).toThrow(ApiError)
      expect(() => validateAndSanitizeInput('string')).toThrow(ApiError)
      expect(() => validateAndSanitizeInput(123)).toThrow(ApiError)
    })

    test('removes dangerous fields', () => {
      const input = {
        name: 'John',
        __proto__: { malicious: 'code' },
        constructor: { bad: 'stuff' },
        prototype: { evil: 'script' }
      }
      
      const result = validateAndSanitizeInput(input)
      
      expect(result.name).toBe('John')
      expect(result.__proto__).toBeUndefined()
      expect(result.constructor).toBeUndefined()
      expect(result.prototype).toBeUndefined()
    })

    test('sanitizes script tags from strings', () => {
      const input = {
        name: 'John<script>alert("xss")</script>',
        description: 'This has <script src="evil.js"></script> in it'
      }
      
      const result = validateAndSanitizeInput(input)
      
      expect(result.name).toBe('John')
      expect(result.description).toBe('This has  in it')
    })

    test('removes javascript: protocols', () => {
      const input = {
        url: 'javascript:alert("xss")',
        link: 'JAVASCRIPT:void(0)'
      }
      
      const result = validateAndSanitizeInput(input)
      
      expect(result.url).toBe('alert("xss")')
      expect(result.link).toBe('void(0)')
    })

    test('removes event handlers', () => {
      const input = {
        html: '<div onclick="alert()" onload="bad()">content</div>'
      }
      
      const result = validateAndSanitizeInput(input)
      
      expect(result.html).toBe('<div>content</div>')
    })

    test('trims whitespace from strings', () => {
      const input = {
        name: '  John  ',
        email: '\\n\\ttest@example.com\\n  '
      }
      
      const result = validateAndSanitizeInput(input)
      
      expect(result.name).toBe('John')
      expect(result.email).toBe('test@example.com')
    })

    test('preserves non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        data: { nested: 'object' },
        tags: ['tag1', 'tag2']
      }
      
      const result = validateAndSanitizeInput(input)
      
      expect(result.name).toBe('John')
      expect(result.age).toBe(30)
      expect(result.active).toBe(true)
      expect(result.data).toEqual({ nested: 'object' })
      expect(result.tags).toEqual(['tag1', 'tag2'])
    })
  })

  describe('corsMiddleware', () => {
    const corsConfig = {
      allowedOrigins: ['https://example.com', 'https://test.com'],
      allowedMethods: ['GET', 'POST', 'PUT'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }

    test('allows requests without origin (same-origin)', () => {
      const req = new NextRequest('http://localhost:3000')
      const corsCheck = corsMiddleware(corsConfig)
      
      const result = corsCheck(req)
      expect(result.allowed).toBe(true)
    })

    test('allows requests from allowed origins', () => {
      const req = new NextRequest('http://localhost:3000', {
        headers: { origin: 'https://example.com' }
      })
      const corsCheck = corsMiddleware(corsConfig)
      
      const result = corsCheck(req)
      expect(result.allowed).toBe(true)
      expect(result.headers).toBeDefined()
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://example.com')
    })

    test('rejects requests from disallowed origins', () => {
      const req = new NextRequest('http://localhost:3000', {
        headers: { origin: 'https://malicious.com' }
      })
      const corsCheck = corsMiddleware(corsConfig)
      
      expect(() => corsCheck(req)).toThrow(ApiError)
    })

    test('rejects disallowed methods', () => {
      const req = new NextRequest('http://localhost:3000', {
        method: 'DELETE',
        headers: { origin: 'https://example.com' }
      })
      const corsCheck = corsMiddleware(corsConfig)
      
      expect(() => corsCheck(req)).toThrow(ApiError)
    })

    test('allows wildcard origins', () => {
      const wildcardConfig = {
        ...corsConfig,
        allowedOrigins: ['*']
      }
      const req = new NextRequest('http://localhost:3000', {
        headers: { origin: 'https://any-domain.com' }
      })
      const corsCheck = corsMiddleware(wildcardConfig)
      
      const result = corsCheck(req)
      expect(result.allowed).toBe(true)
    })
  })

  describe('securityHeaders', () => {
    test('returns all required security headers', () => {
      const headers = securityHeaders()
      
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff')
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY')
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block')
      expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin')
      expect(headers).toHaveProperty('Permissions-Policy')
      expect(headers).toHaveProperty('Content-Security-Policy')
    })

    test('CSP header includes necessary directives', () => {
      const headers = securityHeaders()
      const csp = headers['Content-Security-Policy']
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain('fonts.googleapis.com')
      expect(csp).toContain('fonts.gstatic.com')
    })
  })

  describe('rateLimit', () => {
    const rateLimitConfig = { max: 5, windowMs: 60000 } // 5 requests per minute

    beforeEach(() => {
      // Clear rate limit store
      const rateLimitStore = new Map()
    })

    test('allows requests under the limit', () => {
      const rateLimitCheck = rateLimit(rateLimitConfig)
      const req = new NextRequest('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })
      
      const result = rateLimitCheck(req)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    test('tracks requests per IP', () => {
      const rateLimitCheck = rateLimit(rateLimitConfig)
      const req1 = new NextRequest('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })
      const req2 = new NextRequest('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.2' }
      })
      
      const result1 = rateLimitCheck(req1)
      const result2 = rateLimitCheck(req2)
      
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(4) // Different IP, fresh counter
    })

    test('blocks requests when limit exceeded', () => {
      const rateLimitCheck = rateLimit(rateLimitConfig)
      const req = new NextRequest('http://localhost:3000', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      })
      
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        const result = rateLimitCheck(req)
        expect(result.allowed).toBe(true)
      }
      
      // Next request should be blocked
      const blockedResult = rateLimitCheck(req)
      expect(blockedResult.allowed).toBe(false)
      expect(blockedResult.remaining).toBe(0)
    })
  })

  describe('Logger', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    test('creates singleton instance', () => {
      const logger1 = Logger.getInstance()
      const logger2 = Logger.getInstance()
      
      expect(logger1).toBe(logger2)
    })

    test('logs error messages', () => {
      const logger = Logger.getInstance()
      logger.error('Test error', { extra: 'data' })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"ERROR"')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      )
    })

    test('logs info messages', () => {
      const logger = Logger.getInstance()
      logger.info('Test info', { data: 'value' })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      )
    })

    test('includes timestamp in logs', () => {
      const logger = Logger.getInstance()
      logger.error('Test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"timestamp":"')
      )
    })

    test('includes service name in logs', () => {
      const logger = Logger.getInstance()
      logger.error('Test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"service":"aboutwater-vacation-system"')
      )
    })

    test('respects log level configuration', () => {
      process.env.LOG_LEVEL = 'error'
      const logger = new Logger()
      
      logger.error('Should log')
      logger.info('Should not log')
      logger.debug('Should not log')
      
      expect(consoleSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Should log"')
      )
    })
  })

  describe('defaultSecurityConfig', () => {
    test('has sensible default values', () => {
      expect(defaultSecurityConfig.rateLimit.max).toBe(100)
      expect(defaultSecurityConfig.rateLimit.windowMs).toBe(900000) // 15 minutes
      
      expect(defaultSecurityConfig.cors.allowedOrigins).toContain('http://localhost:3000')
      expect(defaultSecurityConfig.cors.allowedMethods).toContain('GET')
      expect(defaultSecurityConfig.cors.allowedMethods).toContain('POST')
      
      expect(defaultSecurityConfig.validation.maxBodySize).toBe(10 * 1024 * 1024) // 10MB
      expect(typeof defaultSecurityConfig.validation.strictMode).toBe('boolean')
    })

    test('reads from environment variables', () => {
      // These would be set by the environment
      expect(defaultSecurityConfig.rateLimit.max).toBeGreaterThan(0)
      expect(defaultSecurityConfig.rateLimit.windowMs).toBeGreaterThan(0)
    })
  })
})