'use client'

import { RefreshCw, Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'white'
  message?: string
  fullScreen?: boolean
  type?: 'spinner' | 'pulse' | 'dots'
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  message,
  fullScreen = false,
  type = 'spinner'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-aboutwater-primary',
    secondary: 'text-gray-400',
    white: 'text-white'
  }

  const renderSpinner = () => {
    switch (type) {
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} ${colorClasses[variant]} animate-pulse`}>
            <div className="w-full h-full bg-current rounded-full"></div>
          </div>
        )

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 ${colorClasses[variant]} bg-current rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        )

      default:
        return (
          <Loader2 className={`${sizeClasses[size]} ${colorClasses[variant]} animate-spin`} />
        )
    }
  }

  const content = (
    <div className="flex flex-col items-center justify-center">
      {renderSpinner()}
      {message && (
        <p className={`mt-4 text-sm ${colorClasses[variant]} font-asap`}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center">
          {content}
        </div>
      </div>
    )
  }

  return content
}

// Skeleton loader for cards and tables
export function SkeletonLoader({
  rows = 3,
  cols = 4
}: {
  rows?: number
  cols?: number
}) {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded flex-1"
            ></div>
          ))}
        </div>
      ))}
    </div>
  )
}

// Loading card component
export function LoadingCard({
  message = "Loading..."
}: {
  message?: string
}) {
  return (
    <div className="card-aboutwater p-8">
      <div className="flex items-center justify-center">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  )
}