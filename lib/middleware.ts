/**
 * Production-Grade Middleware for AboutWater Vacation Management System
 * Provides comprehensive error handling, security, and logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface SecurityConfig {
  rateLimit: {
    max: number
    windowMs: number
  }
  cors: {
    allowedOrigins: string[]
    allowedMethods: string[]
    allowedHeaders: string[]
  }
  validation: {
    maxBodySize: number
    strictMode: boolean
  }
}

export const defaultSecurityConfig: SecurityConfig = {
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000') // 15 minutes
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  validation: {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    strictMode: process.env.NODE_ENV === 'production'
  }
}

/**
 * Advanced error handling with structured logging
 */
export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: any
  public requestId: string

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message)
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.details = details
    this.requestId = crypto.randomUUID()
    
    // Capture stack trace
    Error.captureStackTrace(this, ApiError)
  }
}

/**
 * Structured API response format
 */
export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  code?: string
  details?: any
  requestId: string
  timestamp: string
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  code?: string,
  details?: any,
  requestId?: string
): ApiResponse<T> {
  return {
    ok: success,
    data,
    error,
    code,
    details,
    requestId: requestId || crypto.randomUUID(),
    timestamp: new Date().toISOString()
  }
}

/**
 * Advanced rate limiting with IP tracking
 */
export function rateLimit(config: SecurityConfig['rateLimit']) {
  return (req: NextRequest) => {
    const ip = getClientIp(req)
    const now = Date.now()
    const key = `rate_limit:${ip}`
    
    // Clean expired entries periodically
    if (Math.random() < 0.01) { // 1% chance
      cleanExpiredRateLimits(now)
    }
    
    const existing = rateLimitStore.get(key)
    
    if (!existing || now > existing.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return { allowed: true, remaining: config.max - 1 }
    }
    
    if (existing.count >= config.max) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: existing.resetTime
      }
    }
    
    existing.count++
    return { 
      allowed: true, 
      remaining: config.max - existing.count 
    }
  }
}

/**
 * Clean expired rate limit entries
 */
function cleanExpiredRateLimits(now: number) {
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Extract client IP address with fallbacks
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const remoteAddr = req.headers.get('x-vercel-forwarded-for')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  if (remoteAddr) {
    return remoteAddr.trim()
  }
  
  return '127.0.0.1' // fallback
}

/**
 * Input validation and sanitization
 */
export function validateAndSanitizeInput(data: any, schema?: any): any {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Invalid input data', 400, 'INVALID_INPUT')
  }
  
  // Remove potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype']
  const sanitized = { ...data }
  
  dangerousFields.forEach(field => {
    delete sanitized[field]
  })
  
  // Sanitize strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      // Basic XSS prevention
      sanitized[key] = sanitized[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }
  })
  
  return sanitized
}

/**
 * CORS middleware with configurable origins
 */
export function corsMiddleware(config: SecurityConfig['cors']) {
  return (req: NextRequest) => {
    const origin = req.headers.get('origin')
    const method = req.method
    
    // Always allow same-origin requests
    if (!origin) {
      return { allowed: true }
    }
    
    // Check if origin is allowed
    const isAllowedOrigin = config.allowedOrigins.includes(origin) || 
                           config.allowedOrigins.includes('*')
    
    // Check if method is allowed
    const isAllowedMethod = config.allowedMethods.includes(method)
    
    if (!isAllowedOrigin) {
      throw new ApiError('Origin not allowed', 403, 'CORS_ORIGIN_DENIED')
    }
    
    if (!isAllowedMethod) {
      throw new ApiError('Method not allowed', 405, 'CORS_METHOD_DENIED')
    }
    
    return {
      allowed: true,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
        'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400' // 24 hours
      }
    }
  }
}

/**
 * Security headers middleware
 */
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;",
  }
}

/**
 * Main security middleware wrapper
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: Partial<SecurityConfig> = {}
) {
  const finalConfig = { ...defaultSecurityConfig, ...config }
  const rateLimitCheck = rateLimit(finalConfig.rateLimit)
  const corsCheck = corsMiddleware(finalConfig.cors)
  
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()
    
    try {
      // Rate limiting
      const rateLimitResult = rateLimitCheck(req)
      if (!rateLimitResult.allowed) {
        const resetDate = new Date(rateLimitResult.resetTime || 0)
        return NextResponse.json(
          createApiResponse(
            false, 
            null, 
            'Rate limit exceeded', 
            'RATE_LIMIT_EXCEEDED',
            { resetTime: resetDate.toISOString() },
            requestId
          ),
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitResult.resetTime || 0 - Date.now()) / 1000).toString(),
              'X-RateLimit-Limit': finalConfig.rateLimit.max.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (rateLimitResult.resetTime || 0).toString()
            }
          }
        )
      }
      
      // CORS check
      const corsResult = corsCheck(req)
      
      // Handle OPTIONS preflight requests
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            ...corsResult.headers,
            ...securityHeaders()
          }
        })
      }
      
      // Add security headers to request
      const response = await handler(req)
      
      // Add security and CORS headers to response
      const headers = new Headers(response.headers)
      Object.entries(securityHeaders()).forEach(([key, value]) => {
        headers.set(key, value)
      })
      
      if (corsResult.headers) {
        Object.entries(corsResult.headers).forEach(([key, value]) => {
          headers.set(key, value)
        })
      }
      
      // Add performance and debugging headers
      headers.set('X-Request-ID', requestId)
      headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
      headers.set('X-RateLimit-Limit', finalConfig.rateLimit.max.toString())
      headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
      
    } catch (error) {
      console.error(`[Security] Request failed [${requestId}]:`, error)
      
      if (error instanceof ApiError) {
        return NextResponse.json(
          createApiResponse(false, null, error.message, error.code, error.details, requestId),
          { status: error.statusCode }
        )
      }
      
      return NextResponse.json(
        createApiResponse(false, null, 'Internal server error', 'INTERNAL_ERROR', null, requestId),
        { status: 500 }
      )
    }
  }
}

/**
 * Logger utility for structured logging
 */
export class Logger {
  private static instance: Logger
  private logLevel: string
  
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info'
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug']
    const currentIndex = levels.indexOf(this.logLevel)
    const messageIndex = levels.indexOf(level)
    return messageIndex <= currentIndex
  }
  
  private log(level: string, message: string, meta?: any) {
    if (!this.shouldLog(level)) return
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta,
      service: 'aboutwater-vacation-system'
    }
    
    console.log(JSON.stringify(logEntry))
  }
  
  error(message: string, meta?: any) {
    this.log('error', message, meta)
  }
  
  warn(message: string, meta?: any) {
    this.log('warn', message, meta)
  }
  
  info(message: string, meta?: any) {
    this.log('info', message, meta)
  }
  
  debug(message: string, meta?: any) {
    this.log('debug', message, meta)
  }
}

export const logger = Logger.getInstance()