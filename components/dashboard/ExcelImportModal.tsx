'use client'

import { useState } from 'react'
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react'
import { importExcelToDatabase } from '@/lib/databaseOperations'

interface ExcelImportModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface ImportResult {
  success: boolean
  employeesImported: number
  vacationsImported: number
  message: string
}

export default function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    if (!validTypes.includes(selectedFile.type)) {
      alert('Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 10MB')
      return
    }

    setFile(selectedFile)
    setResult(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)

    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleImport = async () => {
    if (!file) {
      alert('Bitte wählen Sie zuerst eine Datei aus')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Starting Excel import...', file.name)

      const importResult = await importExcelToDatabase(file)
      setResult(importResult)

      if (importResult.success) {
        console.log('✅ Excel import completed successfully')

        // Show success message with details
        const message = `Import erfolgreich!\n\n` +
          `• ${importResult.employeesImported} Mitarbeiter importiert\n` +
          `• ${importResult.vacationsImported} Urlaubseinträge importiert\n\n` +
          `Die Daten sind jetzt in der Datenbank verfügbar.`

        alert(message)

        // Trigger refresh and close
        onSuccess()
        onClose()
      } else {
        console.error('❌ Excel import failed:', importResult.message)
      }
    } catch (error) {
      console.error('❌ Excel import error:', error)
      setResult({
        success: false,
        employeesImported: 0,
        vacationsImported: 0,
        message: `Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setResult(null)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <FileSpreadsheet className="h-6 w-6 text-[#1c5975] mr-2" />
            <h3 className="text-xl font-medium text-gray-900 font-asap">Excel Import</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Import Information */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 font-asap mb-2">Unterstützte Excel-Formate:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="font-asap">• Arbeitsblatt "Mitarbeiter-Übersicht" mit Spalten: Name, Erlaubte Tage, Verbrauchte Tage</li>
            <li className="font-asap">• Arbeitsblatt "Urlaubseinträge" mit Spalten: Mitarbeiter, Startdatum, Enddatum, Tage</li>
            <li className="font-asap">• Excel-Dateien (.xlsx) die vom System exportiert wurden</li>
          </ul>
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 font-asap mb-2">
            Excel-Datei auswählen
          </label>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${dragOver
                  ? 'border-[#1c5975] bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-sm text-gray-600 font-asap mb-2">
                Ziehen Sie Ihre Excel-Datei hierher oder
              </div>
              <label className="cursor-pointer">
                <span className="text-[#1c5975] hover:text-[#164962] font-medium font-asap">
                  klicken Sie hier zum Auswählen
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <div className="text-xs text-gray-500 mt-2 font-asap">
                Unterstützte Formate: .xlsx, .xls (max. 10MB)
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 font-asap">{file.name}</div>
                    <div className="text-xs text-gray-500 font-asap">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="text-gray-400 hover:text-gray-600"
                  title="Datei entfernen"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Import Result */}
        {result && (
          <div className={`mb-6 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              )}
              <div className="flex-1">
                <h4 className={`text-sm font-medium font-asap ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Import erfolgreich!' : 'Import fehlgeschlagen'}
                </h4>
                <div className={`text-sm font-asap mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message}
                </div>
                {result.success && (
                  <div className="text-xs text-green-600 mt-2 font-asap">
                    Die importierten Daten sind jetzt für alle Benutzer verfügbar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 font-asap"
          >
            Abbrechen
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1c5975] hover:bg-[#164962] disabled:opacity-50 disabled:cursor-not-allowed font-asap"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importiere...
              </div>
            ) : (
              'Excel importieren'
            )}
          </button>
        </div>

        {/* Warning Note */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-700 font-asap">
              <strong>Wichtiger Hinweis:</strong> Der Import überschreibt bestehende Mitarbeiterdaten.
              Stellen Sie sicher, dass Sie aktuelle Daten exportiert haben, bevor Sie importieren.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}