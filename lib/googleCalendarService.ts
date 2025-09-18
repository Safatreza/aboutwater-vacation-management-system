// Google Calendar API Integration for German Holidays
// Real-time holiday data fetching and caching

const GOOGLE_API_KEY = 'AIzaSyAiuh2Wu7Nt0CfS6JqkQK4T4WCLhB6GHxk'
const GERMAN_HOLIDAYS_CALENDAR_ID = 'en.german%23holiday%40group.v.calendar.google.com'
const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  start: {
    date?: string
    dateTime?: string
  }
  end: {
    date?: string
    dateTime?: string
  }
  description?: string
}

export interface ProcessedHoliday {
  id: string
  date: string
  name: string
  source: string
  region_code: string
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService
  private cache: Map<string, ProcessedHoliday[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService()
    }
    return GoogleCalendarService.instance
  }

  /**
   * Fetch German holidays for a specific year from Google Calendar API
   */
  async fetchGermanHolidays(year: number): Promise<ProcessedHoliday[]> {
    const cacheKey = `DE-${year}`

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log(`[GoogleCalendar] Using cached holidays for ${year}`)
      return this.cache.get(cacheKey)!
    }

    try {
      console.log(`[GoogleCalendar] Fetching German holidays for ${year} from Google Calendar API`)

      const timeMin = `${year}-01-01T00:00:00Z`
      const timeMax = `${year}-12-31T23:59:59Z`

      const url = `${GOOGLE_CALENDAR_BASE_URL}/${GERMAN_HOLIDAYS_CALENDAR_ID}/events?` +
        `key=${GOOGLE_API_KEY}&` +
        `timeMin=${timeMin}&` +
        `timeMax=${timeMax}&` +
        `orderBy=startTime&` +
        `singleEvents=true&` +
        `maxResults=50`

      console.log(`[GoogleCalendar] Fetching URL: ${url}`)

      const response = await fetch(url)

      if (!response.ok) {
        console.error(`[GoogleCalendar] API Error ${response.status}: ${response.statusText}`)
        const errorText = await response.text()
        console.error(`[GoogleCalendar] Error details:`, errorText)

        // Use fallback holidays when API is restricted
      console.log(`[GoogleCalendar] Using fallback holidays due to API restrictions`)
      return this.getFallbackGermanHolidays(year)
      }

      const data = await response.json()

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from Google Calendar API')
      }

      const holidays = this.processGoogleCalendarEvents(data.items, year)

      // Cache the results
      this.cache.set(cacheKey, holidays)
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION)

      console.log(`[GoogleCalendar] Successfully fetched and cached ${holidays.length} German holidays for ${year}`)

      return holidays
    } catch (error) {
      console.error(`[GoogleCalendar] Failed to fetch German holidays for ${year}:`, error)

      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        console.warn(`[GoogleCalendar] Using expired cache for ${year}`)
        return this.cache.get(cacheKey)!
      }

      // Use fallback holidays when API fails
      console.log(`[GoogleCalendar] Using fallback holidays due to API error`)
      return this.getFallbackGermanHolidays(year)
    }
  }

  /**
   * Process Google Calendar events into our holiday format
   */
  private processGoogleCalendarEvents(events: GoogleCalendarEvent[], year: number): ProcessedHoliday[] {
    const holidays: ProcessedHoliday[] = []

    for (const event of events) {
      try {
        // Use date field for all-day events (holidays)
        const date = event.start.date

        if (!date) {
          console.warn('[GoogleCalendar] Skipping event without date:', event.summary)
          continue
        }

        // Ensure the date is in the correct year
        if (!date.startsWith(year.toString())) {
          continue
        }

        const holiday: ProcessedHoliday = {
          id: `google-${event.id}`,
          date: date,
          name: event.summary,
          source: 'google',
          region_code: 'DE'
        }

        holidays.push(holiday)
      } catch (error) {
        console.warn('[GoogleCalendar] Error processing event:', event, error)
      }
    }

    return holidays.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Check if cache is valid for a given key
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.cache.has(cacheKey) || !this.cacheExpiry.has(cacheKey)) {
      return false
    }

    return Date.now() < this.cacheExpiry.get(cacheKey)!
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
    console.log('[GoogleCalendar] Cache cleared')
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { cacheKeys: string[], totalEntries: number } {
    return {
      cacheKeys: Array.from(this.cache.keys()),
      totalEntries: this.cache.size
    }
  }

  /**
   * Get fallback German holidays when API fails
   */
  private getFallbackGermanHolidays(year: number): ProcessedHoliday[] {
    const holidays: ProcessedHoliday[] = [
      {
        id: `fallback-${year}-neujahr`,
        date: `${year}-01-01`,
        name: 'Neujahr',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-tagderarbeit`,
        date: `${year}-05-01`,
        name: 'Tag der Arbeit',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-tagderdeutscheneinheit`,
        date: `${year}-10-03`,
        name: 'Tag der Deutschen Einheit',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-weihnachten`,
        date: `${year}-12-25`,
        name: 'Weihnachtstag',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-zweiterweihnachtstag`,
        date: `${year}-12-26`,
        name: '2. Weihnachtstag',
        source: 'google',
        region_code: 'DE'
      }
    ]

    // Calculate Easter and related holidays
    const easter = this.calculateEaster(year)
    const goodFriday = new Date(easter)
    goodFriday.setDate(easter.getDate() - 2)

    const easterMonday = new Date(easter)
    easterMonday.setDate(easter.getDate() + 1)

    const ascension = new Date(easter)
    ascension.setDate(easter.getDate() + 39)

    const whitMonday = new Date(easter)
    whitMonday.setDate(easter.getDate() + 50)

    holidays.push(
      {
        id: `fallback-${year}-karfreitag`,
        date: goodFriday.toISOString().split('T')[0],
        name: 'Karfreitag',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-ostermontag`,
        date: easterMonday.toISOString().split('T')[0],
        name: 'Ostermontag',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-himmelfahrt`,
        date: ascension.toISOString().split('T')[0],
        name: 'Christi Himmelfahrt',
        source: 'google',
        region_code: 'DE'
      },
      {
        id: `fallback-${year}-pfingstmontag`,
        date: whitMonday.toISOString().split('T')[0],
        name: 'Pfingstmontag',
        source: 'google',
        region_code: 'DE'
      }
    )

    return holidays.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Calculate Easter date for a given year
   */
  private calculateEaster(year: number): Date {
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

  /**
   * Sync holidays with database - to be called from API endpoints
   */
  async syncHolidaysWithDatabase(year: number, updateCallback?: (holidays: ProcessedHoliday[]) => Promise<number>): Promise<{ synced: number, total: number }> {
    try {
      console.log(`[GoogleCalendar] Starting holiday sync for ${year}`)

      const holidays = await this.fetchGermanHolidays(year)

      if (updateCallback) {
        const syncedCount = await updateCallback(holidays)
        console.log(`[GoogleCalendar] Synced ${syncedCount} new holidays out of ${holidays.length} total`)

        return {
          synced: syncedCount,
          total: holidays.length
        }
      }

      return {
        synced: 0,
        total: holidays.length
      }
    } catch (error) {
      console.error(`[GoogleCalendar] Holiday sync failed for ${year}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const googleCalendarService = GoogleCalendarService.getInstance()