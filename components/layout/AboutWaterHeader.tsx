'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, BarChart3, Download, Menu, X } from 'lucide-react'
import Image from 'next/image'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  description: string
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Übersicht und Statistiken'
  },
  {
    name: 'Kalender',
    href: '/calendar',
    icon: Calendar,
    description: 'Urlaubskalender anzeigen'
  },
  {
    name: 'Mitarbeiter',
    href: '/employees',
    icon: Users,
    description: 'Mitarbeiter verwalten'
  },
  {
    name: 'Backup',
    href: '/backup',
    icon: Download,
    description: 'Daten-Backup erstellen'
  }
]

export default function AboutWaterHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActivePath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <Image
                    src="/images/logo.png"
                    alt="AboutWater Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-[#1c5975] leading-tight">
                  aboutwater
                </h1>
                <p className="text-xs text-gray-500 leading-tight">
                  Vacation Management
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'text-[#1c5975] bg-blue-50 shadow-sm'
                      : 'text-gray-600 hover:text-[#1c5975] hover:bg-gray-50'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className={`
                    w-4 h-4 mr-2 transition-colors duration-200
                    ${isActive ? 'text-[#1c5975]' : 'text-gray-400 group-hover:text-[#1c5975]'}
                  `} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button className="p-2 text-gray-400 hover:text-[#1c5975] rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-[#1c5975] rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'text-[#1c5975] bg-blue-50'
                      : 'text-gray-600 hover:text-[#1c5975] hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 mr-3 transition-colors duration-200
                    ${isActive ? 'text-[#1c5975]' : 'text-gray-400 group-hover:text-[#1c5975]'}
                  `} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              )
            })}
            
            {/* Mobile Settings */}
            <button className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-[#1c5975] hover:bg-gray-50 transition-all duration-200">
              <Settings className="w-5 h-5 mr-3 text-gray-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Einstellungen</div>
                <div className="text-xs text-gray-500">System konfigurieren</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}