import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/dashboard'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js image
jest.mock('next/image', () => {
  const MockedImage = (props) => {
    return <img {...props} />
  }
  MockedImage.displayName = 'NextImage'
  return MockedImage
})

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.GOOGLE_API_KEY = 'test-google-api-key'
process.env.EMAIL_TO = 'test@aboutwater.de'

// Mock fetch globally
global.fetch = jest.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
})

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})