'use client'

// import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Dashboard from '@/components/dashboard/Dashboard'

export default function DashboardPage() {
  // const { user, loading } = useAuth()
  const router = useRouter()

  // Commented out authentication checks for now
  /*
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1c5975]"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }
  */

  return <Dashboard />
}
