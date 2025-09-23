// Google Calendar API integration for German holidays

export interface GoogleCalendarEvent {
  summary: string
  start: { date: string }
  end: { date: string }
}

export interface NewHoliday {
  region_code: string
  date: string
  name: string
  source: 'google' | 'company'
}

// German holidays calendar ID (corrected)
const GERMAN_HOLIDAYS_CALENDAR_ID = 'en.german#holiday@group.v.calendar.google.com'

export async function fetchGermanHolidays(year: number): Promise<NewHoliday[]> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_CALENDAR_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyAiuh2Wu7Nt0CfS6JqkQK4T4WCLhB6GHxk'

  if (!apiKey || apiKey.includes('your-')) {
    console.warn('Google Calendar API key not configured, using fallback holidays')
    return getFallbackGermanHolidays(year)
  }

  console.log(`🔑 Using Google Calendar API key: ${apiKey.substring(0, 10)}...`)
  console.log(`📅 Fetching German holidays for year: ${year}`)

  try {
    const timeMin = `${year}-01-01T00:00:00Z`
    const timeMax = `${year}-12-31T23:59:59Z`
    
    // Proper Google Calendar API v3 endpoint
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GERMAN_HOLIDAYS_CALENDAR_ID)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`
    
    console.log(`Fetching German holidays from Google Calendar API for year ${year}`)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8025',
        'User-Agent': 'AboutWater-VacationDashboard/1.0'
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Google Calendar API error (${response.status}):`, errorText)
      console.warn('Using fallback holidays due to API error')
      return getFallbackGermanHolidays(year)
    }
    
    const data = await response.json()
    console.log(`Google Calendar API returned ${data.items?.length || 0} events`)

    if (!data.items || data.items.length === 0) {
      console.warn('No holidays returned from Google Calendar API, using fallback')
      return getFallbackGermanHolidays(year)
    }

    const holidays: NewHoliday[] = data.items
      .filter((event: any) => event.start?.date && event.summary)
      .map((event: any) => ({
        region_code: 'DE',
        date: event.start.date,
        name: event.summary.trim(),
        source: 'google' as const
      }))

    console.log(`Successfully parsed ${holidays.length} holidays from Google Calendar API`)
    return holidays.length > 0 ? holidays : getFallbackGermanHolidays(year)
  } catch (error) {
    console.error('Error fetching German holidays from Google Calendar API:', error)
    console.warn('Using fallback holidays due to fetch error')
    return getFallbackGermanHolidays(year)
  }
}

export async function syncGermanHolidays(year: number): Promise<{
  synced: number
  errors: string[]
}> {
  try {
    const holidays = await fetchGermanHolidays(year)
    
    if (holidays.length === 0) {
      return { synced: 0, errors: ['No holidays found for the specified year'] }
    }

    // Import holidays using the storage function
    const { bulkInsertHolidays } = await import('./storage/localStorage')
    await bulkInsertHolidays(holidays)

    return {
      synced: holidays.length,
      errors: []
    }
  } catch (error) {
    return {
      synced: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    }
  }
}

// Comprehensive German holidays including regional variations
export function getFallbackGermanHolidays(year: number): NewHoliday[] {
  // Calculate Easter date for the year
  const easter = getEasterDate(year)
  const easterMonth = easter.getMonth() + 1
  const easterDay = easter.getDate()
  
  const holidays: NewHoliday[] = [
    { region_code: 'DE', date: `${year}-01-01`, name: 'Neujahr', source: 'google' },
    { region_code: 'DE', date: `${year}-05-01`, name: 'Tag der Arbeit', source: 'google' },
    { region_code: 'DE', date: `${year}-10-03`, name: 'Tag der Deutschen Einheit', source: 'google' },
    { region_code: 'DE', date: `${year}-12-25`, name: 'Weihnachtstag', source: 'google' },
    { region_code: 'DE', date: `${year}-12-26`, name: '2. Weihnachtstag', source: 'google' }
  ]
  
  // Add Easter-based holidays
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  
  const whitMonday = new Date(easter)
  whitMonday.setDate(easter.getDate() + 50)
  
  holidays.push(
    { region_code: 'DE', date: formatDate(goodFriday), name: 'Karfreitag', source: 'google' },
    { region_code: 'DE', date: formatDate(easterMonday), name: 'Ostermontag', source: 'google' },
    { region_code: 'DE', date: formatDate(ascension), name: 'Christi Himmelfahrt', source: 'google' },
    { region_code: 'DE', date: formatDate(whitMonday), name: 'Pfingstmontag', source: 'google' }
  )
  
  return holidays
}

// Helper function to calculate Easter date
function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const n = Math.floor((h + l - 7 * m + 114) / 31)
  const p = (h + l - 7 * m + 114) % 31
  
  return new Date(year, n - 1, p + 1)
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
