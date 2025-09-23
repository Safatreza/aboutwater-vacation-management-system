'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: { id: string; isAuthenticated: boolean } | null
  loading: boolean
  login: (pin: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Simple PIN authentication - in production, you might want to hash this
const ADMIN_PIN = '1234' // Default PIN - can be changed in environment variables

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; isAuthenticated: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedAuth = localStorage.getItem('aboutwater_auth')
    if (savedAuth === 'authenticated') {
      setUser({ id: 'admin', isAuthenticated: true })
    }
    setLoading(false)
  }, [])

  const login = async (pin: string): Promise<boolean> => {
    const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN || ADMIN_PIN
    
    if (pin === adminPin) {
      const authUser = { id: 'admin', isAuthenticated: true }
      setUser(authUser)
      localStorage.setItem('aboutwater_auth', 'authenticated')
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('aboutwater_auth')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
