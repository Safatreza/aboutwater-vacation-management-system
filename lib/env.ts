// Environment variable validation helper
export function validateEnvironment(): { valid: boolean; error?: string } {
  const requiredEnvVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value === 'placeholder-key' || value.includes('placeholder')) {
      return {
        valid: false,
        error: `Environment variable ${key} is not configured. Please set up your environment variables in Vercel dashboard.`
      }
    }
  }

  return { valid: true }
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}