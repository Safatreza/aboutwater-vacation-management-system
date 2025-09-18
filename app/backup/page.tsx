'use client'

import { useState } from 'react'
import AboutWaterHeader from '@/components/layout/AboutWaterHeader'
import { Download, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [backupStatus, setBackupStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleBackup = async () => {
    setIsBackingUp(true)
    setBackupStatus('idle')

    try {
      const response = await fetch('/api/backup', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        setBackupStatus('success')
        setLastBackup(new Date().toISOString())
      } else {
        setBackupStatus('error')
      }
    } catch (error) {
      console.error('Backup error:', error)
      setBackupStatus('error')
    } finally {
      setIsBackingUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <AboutWaterHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-8 w-8 text-[#1c5975]" />
            <h1 className="text-3xl font-bold text-[#1c5975] font-asap">
              Daten-Backup
            </h1>
          </div>
          <p className="text-gray-600 font-asap">
            Erstellen Sie ein Backup aller Urlaubs- und Mitarbeiterdaten
          </p>
        </div>

        {/* Backup Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#1c5975] font-asap mb-4">
            Backup-Status
          </h2>

          <div className="space-y-4">
            {backupStatus === 'success' && (
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 font-asap">
                    Backup erfolgreich erstellt
                  </p>
                  <p className="text-xs text-green-600 font-asap">
                    Die Daten wurden erfolgreich gesichert und per E-Mail versendet.
                  </p>
                </div>
              </div>
            )}

            {backupStatus === 'error' && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800 font-asap">
                    Backup fehlgeschlagen
                  </p>
                  <p className="text-xs text-red-600 font-asap">
                    Es gab einen Fehler beim Erstellen des Backups. Versuchen Sie es später erneut.
                  </p>
                </div>
              </div>
            )}

            {lastBackup && (
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 font-asap">
                    Letztes Backup: {new Date(lastBackup).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Backup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1c5975] font-asap mb-4">
            Manuelles Backup erstellen
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 font-asap">
                    Was wird gesichert?
                  </p>
                  <ul className="text-xs text-blue-600 font-asap mt-1 space-y-1">
                    <li>• Alle Mitarbeiterdaten und Urlaubskontingente</li>
                    <li>• Vollständige Urlaubseinträge und -berechnungen</li>
                    <li>• Feiertage und Kalenderdaten</li>
                    <li>• Export als Excel-Datei per E-Mail</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full btn-aboutwater flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBackingUp ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Backup wird erstellt...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Backup jetzt erstellen</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center font-asap">
              Das Backup wird an safat.majumder@aboutwater.de gesendet
            </p>
          </div>
        </div>

        {/* Information */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 font-asap mb-2">
            Hinweise zum Backup
          </h3>
          <ul className="text-xs text-gray-600 font-asap space-y-1">
            <li>• Backups werden automatisch täglich um 02:00 Uhr erstellt</li>
            <li>• Manuelle Backups können jederzeit über diese Seite erstellt werden</li>
            <li>• Alle Daten werden verschlüsselt übertragen und gespeichert</li>
            <li>• Bei Problemen wenden Sie sich an den IT-Support</li>
          </ul>
        </div>
      </div>
    </div>
  )
}