'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from './AuthProvider'

export default function LoginForm() {
  const [pin, setPin] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus on first input when component mounts
    inputRefs.current[0]?.focus()
  }, [])

  const handlePinChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError('')

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are filled
    if (newPin.every(digit => digit !== '') && newPin.join('').length === 4) {
      handleSubmit(newPin.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle Enter to submit if all digits filled
    if (e.key === 'Enter') {
      if (pin.every(digit => digit !== '')) {
        handleSubmit(pin.join(''))
      }
    }
  }

  const handleSubmit = async (pinValue?: string) => {
    const pinToSubmit = pinValue || pin.join('')
    
    if (pinToSubmit.length !== 4) {
      setError('Please enter a 4-digit PIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await login(pinToSubmit)
      
      if (success) {
        router.push('/dashboard')
      } else {
        setError('Invalid PIN. Please try again.')
        setPin(['', '', '', ''])
        setShake(true)
        setTimeout(() => setShake(false), 600)
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Login failed. Please try again.')
      setPin(['', '', '', ''])
      setShake(true)
      setTimeout(() => setShake(false), 600)
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    
    if (pastedText.length <= 4) {
      const newPin = pastedText.split('').concat(['', '', '', '']).slice(0, 4)
      setPin(newPin)
      
      // Focus on next empty input or last input
      const nextEmptyIndex = newPin.findIndex(digit => digit === '')
      const focusIndex = nextEmptyIndex === -1 ? 3 : nextEmptyIndex
      inputRefs.current[focusIndex]?.focus()
      
      // Auto-submit if all digits filled
      if (pastedText.length === 4) {
        handleSubmit(pastedText)
      }
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50"
      style={{
        backgroundImage: 'linear-gradient(135deg, #1c5975 0%, #2a7ea8 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className={`max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center">
          <div className="mx-auto mb-6">
            <Image
              src="/images/landscape_logo.png"
              alt="aboutwater logo"
              width={280}
              height={120}
              className="mx-auto"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-asap">
            Admin Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your 4-digit PIN to access the vacation management system
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="flex justify-center space-x-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-16 h-16 text-2xl font-bold text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c5975] focus:border-[#1c5975] transition-all duration-200 font-asap ${
                  digit ? 'border-[#1c5975] bg-blue-50' : 'border-gray-300'
                } ${error ? 'border-red-500' : ''}`}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in">
              <p className="text-red-600 text-sm font-asap text-center">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1c5975]"></div>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500 font-asap">
              Default PIN: 1234 (can be customized in environment variables)
            </p>
          </div>
        </div>
        
        <div className="text-center pt-4">
          <p className="text-xs text-gray-500 font-asap">
            © 2024 aboutwater GmbH. All rights reserved.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
