// Environment variable validation helper
export function validateEnvironment(): { valid: boolean; error?: string } {
  // No environment validation needed for in-memory storage
  console.log('✅ Environment validation skipped (using in-memory storage)')
  return { valid: true }
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}