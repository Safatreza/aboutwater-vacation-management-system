'use client'

import { useState, useEffect } from 'react'
import AboutWaterHeader from '@/components/layout/AboutWaterHeader'
import { Download, Database, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { generateVacationExcel, getEmployees, getVacations } from '@/lib/clientStorage'

export default function BackupPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [employees, setEmployees] = useState(getEmployees())
  const [vacations, setVacations] = useState(getVacations())

  // Calculate statistics from state
  const totalAllowedDays = employees.reduce((sum, emp) => sum + emp.allowance, 0)
  const totalUsedDays = employees.reduce((sum, emp) => sum + emp.used, 0)

  // REAL-TIME UPDATES: Listen for localStorage changes to update statistics
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('vacation-employees') || e.key.includes('vacation-entries'))) {
        console.log('🔄 Backup Page: localStorage changed, refreshing data')
        setEmployees(getEmployees())
        setVacations(getVacations())
      }
    }

    const handleCustomStorageChange = () => {
      console.log('🔄 Backup Page: Custom storage event, refreshing data')
      setEmployees(getEmployees())
      setVacations(getVacations())
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorageUpdate', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageUpdate', handleCustomStorageChange)
    }
  }, [])

  const handleDownloadExcel = async () => {
    setIsGenerating(true)
    setExportStatus('idle')

    try {
      const success = await generateVacationExcel()

      if (success) {
        setExportStatus('success')
        setLastExport(new Date().toISOString())
      } else {
        setExportStatus('error')
      }
    } catch (error) {
      console.error('Excel generation failed:', error)
      setExportStatus('error')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <AboutWaterHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-[#1c5975]" />
            <h1 className="text-3xl font-bold text-[#1c5975] font-asap">
              Daten-Export
            </h1>
          </div>
          <p className="text-gray-600 font-asap">
            Laden Sie alle Urlaubsdaten als Excel-Datei herunter
          </p>
        </div>

        {/* Data Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-asap">Mitarbeiter</p>
                <p className="text-3xl font-bold text-[#1c5975] font-asap">{employees.length}</p>
              </div>
              <Database className="h-8 w-8 text-[#1c5975]" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-asap">Urlaubseinträge</p>
                <p className="text-3xl font-bold text-green-600 font-asap">{vacations.length}</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 font-asap">Verbrauchte Tage</p>
                <p className="text-3xl font-bold text-orange-600 font-asap">{totalUsedDays}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Export Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1c5975] font-asap mb-4">
            Export-Status
          </h2>

          <div className="space-y-4">
            {exportStatus === 'success' && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 font-asap">
                    Excel-Datei erfolgreich heruntergeladen
                  </p>
                  <p className="text-xs text-green-600 font-asap">
                    Die Excel-Datei wurde erfolgreich erstellt und in Ihren Download-Ordner gespeichert.
                  </p>
                </div>
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800 font-asap">
                    Export fehlgeschlagen
                  </p>
                  <p className="text-xs text-red-600 font-asap">
                    Es gab einen Fehler beim Erstellen der Excel-Datei. Versuchen Sie es erneut.
                  </p>
                </div>
              </div>
            )}

            {lastExport && (
              <div className="flex items-center space-x-3">
                <Download className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 font-asap">
                    Letzter Export: {new Date(lastExport).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Excel Download Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1c5975] font-asap mb-4">
            Excel-Export erstellen
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 font-asap">
                    Was wird exportiert?
                  </p>
                  <ul className="text-xs text-blue-600 font-asap mt-1 space-y-1">
                    <li>• <strong>Mitarbeiter-Übersicht:</strong> Alle Mitarbeiterdaten und Urlaubskontingente</li>
                    <li>• <strong>Urlaubseinträge:</strong> Vollständige Urlaubsperioden mit Datumsbereichen</li>
                    <li>• <strong>Bayern Feiertage:</strong> Feiertage und Schulferien 2025</li>
                    <li>• <strong>Format:</strong> Professional Excel-Datei mit AboutWater-Branding</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadExcel}
              disabled={isGenerating}
              className="w-full btn-aboutwater flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#1c5975',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Excel wird erstellt...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Excel-Datei herunterladen</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500 font-asap">
                Die Excel-Datei wird automatisch in Ihren Download-Ordner gespeichert
              </p>
              <p className="text-xs text-gray-400 font-asap mt-1">
                Dateiname: AboutWater_Urlaubsdaten_{new Date().toISOString().split('T')[0]}.xlsx
              </p>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 font-asap mb-2">
            Excel-Export Informationen
          </h3>
          <ul className="text-xs text-gray-600 font-asap space-y-1">
            <li>• Die Excel-Datei enthält drei separate Arbeitsblätter mit allen Daten</li>
            <li>• Export funktioniert offline - keine Internetverbindung erforderlich</li>
            <li>• Alle aktuellen Daten aus dem localStorage werden exportiert</li>
            <li>• Perfect für Backup, Reporting und externe Analysen</li>
            <li>• Professional formatting mit AboutWater Corporate Design</li>
          </ul>
        </div>
      </div>
    </div>
  )
}