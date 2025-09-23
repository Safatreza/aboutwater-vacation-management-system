'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { useAuth } from '@/components/auth/AuthProvider'
// import LoginForm from '@/components/auth/LoginForm'

export default function HomePage() {
  // const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Temporarily bypass PIN authentication - redirect directly to dashboard
    router.push('/dashboard')
  }, [router])

  // Commented out PIN authentication for now
  /*
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1c5975]"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return <LoginForm />
  */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1c5975]"></div>
    </div>
  )
}
