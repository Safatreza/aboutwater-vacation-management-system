// Data backup and restore utilities for localStorage persistence

export interface BackupData {
  employees: any[]
  vacations: any[]
  timestamp: string
  version: string
}

const BACKUP_KEY = 'aboutwater-vacation-backup'
const CURRENT_VERSION = '1.0.0'

export const saveDataToLocalStorage = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false

    // Fetch current data from APIs
    const [employeesResponse, vacationsResponse] = await Promise.all([
      fetch('/api/employees'),
      fetch('/api/vacations')
    ])

    const employees = await employeesResponse.json()
    const vacations = await vacationsResponse.json()

    const backupData: BackupData = {
      employees,
      vacations,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION
    }

    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData))
    console.log('✅ Data backup saved to localStorage:', {
      employees: employees.length,
      vacations: vacations.length
    })

    return true
  } catch (error) {
    console.error('❌ Failed to save backup to localStorage:', error)
    return false
  }
}

export const loadDataFromLocalStorage = (): BackupData | null => {
  try {
    if (typeof window === 'undefined') return null

    const backupString = localStorage.getItem(BACKUP_KEY)
    if (!backupString) return null

    const backupData: BackupData = JSON.parse(backupString)

    // Validate backup data structure
    if (!backupData.employees || !backupData.vacations || !backupData.timestamp) {
      console.warn('Invalid backup data structure')
      return null
    }

    console.log('📦 Backup data found in localStorage:', {
      employees: backupData.employees.length,
      vacations: backupData.vacations.length,
      timestamp: backupData.timestamp,
      version: backupData.version
    })

    return backupData
  } catch (error) {
    console.error('❌ Failed to load backup from localStorage:', error)
    return null
  }
}

export const restoreDataFromLocalStorage = async (): Promise<boolean> => {
  try {
    const backupData = loadDataFromLocalStorage()
    if (!backupData) {
      console.log('No backup data found in localStorage')
      return false
    }

    // Note: This would restore data if we had restoration endpoints
    // For now, we just notify that backup exists
    console.log('📦 Backup data is available but restoration requires manual import')
    return true
  } catch (error) {
    console.error('❌ Failed to restore data from localStorage:', error)
    return false
  }
}

export const clearLocalStorageBackup = (): boolean => {
  try {
    if (typeof window === 'undefined') return false

    localStorage.removeItem(BACKUP_KEY)
    console.log('🗑️ Cleared localStorage backup')
    return true
  } catch (error) {
    console.error('❌ Failed to clear localStorage backup:', error)
    return false
  }
}

export const exportBackupAsFile = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false

    // Fetch current data from APIs
    const [employeesResponse, vacationsResponse] = await Promise.all([
      fetch('/api/employees'),
      fetch('/api/vacations')
    ])

    const employees = await employeesResponse.json()
    const vacations = await vacationsResponse.json()

    const backupData: BackupData = {
      employees,
      vacations,
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION
    }

    // Create and download backup file
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `aboutwater-vacation-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('📥 Backup file downloaded successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to export backup file:', error)
    return false
  }
}

export const importBackupFromFile = (file: File): Promise<BackupData | null> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string)

          // Validate backup data structure
          if (!backupData.employees || !backupData.vacations || !backupData.timestamp) {
            reject(new Error('Invalid backup file structure'))
            return
          }

          console.log('📂 Backup file loaded successfully:', {
            employees: backupData.employees.length,
            vacations: backupData.vacations.length,
            timestamp: backupData.timestamp,
            version: backupData.version
          })

          resolve(backupData)
        } catch (error) {
          reject(new Error('Failed to parse backup file: ' + error))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read backup file'))
      }

      reader.readAsText(file)
    } catch (error) {
      reject(error)
    }
  })
}

// Auto-backup functionality
export const enableAutoBackup = (): void => {
  if (typeof window === 'undefined') return

  // Save backup every 5 minutes
  const interval = setInterval(async () => {
    await saveDataToLocalStorage()
  }, 5 * 60 * 1000)

  // Save backup on page unload
  window.addEventListener('beforeunload', () => {
    saveDataToLocalStorage()
    clearInterval(interval)
  })

  // Initial backup
  setTimeout(() => {
    saveDataToLocalStorage()
  }, 2000)

  console.log('🔄 Auto-backup enabled (every 5 minutes)')
}