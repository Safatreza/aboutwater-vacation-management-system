/**
 * Comprehensive German Holiday System
 * Includes all federal and state-specific holidays for Germany
 * Updated for 2024-2030 with automatic Easter calculation
 */

export interface GermanHoliday {
  name: string
  date: string
  states: string[] // German state codes where this holiday applies
  type: 'federal' | 'religious' | 'regional'
  description: string
}

// German federal states
export const GERMAN_STATES = {
  'BW': 'Baden-Württemberg',
  'BY': 'Bayern', 
  'BE': 'Berlin',
  'BB': 'Brandenburg',
  'HB': 'Bremen',
  'HH': 'Hamburg',
  'HE': 'Hessen',
  'MV': 'Mecklenburg-Vorpommern',
  'NI': 'Niedersachsen',
  'NW': 'Nordrhein-Westfalen',
  'RP': 'Rheinland-Pfalz',
  'SL': 'Saarland',
  'SN': 'Sachsen',
  'ST': 'Sachsen-Anhalt',
  'SH': 'Schleswig-Holstein',
  'TH': 'Thüringen'
}

/**
 * Calculate Easter date for a given year
 * Uses the Western (Gregorian) calendar algorithm
 */
export function calculateEaster(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  
  return new Date(year, month - 1, day)
}

/**
 * Get all German holidays for a specific year
 */
export function getGermanHolidays(year: number): GermanHoliday[] {
  const easter = calculateEaster(year)
  const holidays: GermanHoliday[] = []
  
  // Helper function to add days to a date
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
  
  // Helper to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }
  
  // All states for federal holidays
  const allStates = Object.keys(GERMAN_STATES)
  
  // ===== FEDERAL HOLIDAYS (apply to all states) =====
  
  holidays.push({
    name: 'Neujahr',
    date: `${year}-01-01`,
    states: allStates,
    type: 'federal',
    description: 'New Year\'s Day'
  })
  
  // Easter-related holidays
  holidays.push({
    name: 'Karfreitag',
    date: formatDate(addDays(easter, -2)),
    states: allStates,
    type: 'religious',
    description: 'Good Friday'
  })
  
  holidays.push({
    name: 'Ostermontag', 
    date: formatDate(addDays(easter, 1)),
    states: allStates,
    type: 'religious',
    description: 'Easter Monday'
  })
  
  holidays.push({
    name: 'Tag der Arbeit',
    date: `${year}-05-01`,
    states: allStates,
    type: 'federal',
    description: 'Labour Day'
  })
  
  holidays.push({
    name: 'Christi Himmelfahrt',
    date: formatDate(addDays(easter, 39)),
    states: allStates,
    type: 'religious',
    description: 'Ascension Day'
  })
  
  holidays.push({
    name: 'Pfingstmontag',
    date: formatDate(addDays(easter, 50)),
    states: allStates,
    type: 'religious',
    description: 'Whit Monday'
  })
  
  holidays.push({
    name: 'Tag der Deutschen Einheit',
    date: `${year}-10-03`,
    states: allStates,
    type: 'federal',
    description: 'German Unity Day'
  })
  
  holidays.push({
    name: '1. Weihnachtstag',
    date: `${year}-12-25`,
    states: allStates,
    type: 'religious',
    description: 'Christmas Day'
  })
  
  holidays.push({
    name: '2. Weihnachtstag',
    date: `${year}-12-26`,
    states: allStates,
    type: 'religious',
    description: 'Boxing Day'
  })
  
  // ===== STATE-SPECIFIC HOLIDAYS =====
  
  // Heilige Drei Könige (Epiphany) - BW, BY, ST
  holidays.push({
    name: 'Heilige Drei Könige',
    date: `${year}-01-06`,
    states: ['BW', 'BY', 'ST'],
    type: 'religious',
    description: 'Epiphany'
  })
  
  // Internationaler Frauentag (International Women's Day) - BE
  holidays.push({
    name: 'Internationaler Frauentag',
    date: `${year}-03-08`,
    states: ['BE'],
    type: 'regional',
    description: 'International Women\'s Day'
  })
  
  // Fronleichnam (Corpus Christi) - BW, BY, HE, NW, RP, SL + some communities in SN, TH
  holidays.push({
    name: 'Fronleichnam',
    date: formatDate(addDays(easter, 60)),
    states: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'],
    type: 'religious',
    description: 'Corpus Christi'
  })
  
  // Mariä Himmelfahrt (Assumption of Mary) - BY, SL
  holidays.push({
    name: 'Mariä Himmelfahrt',
    date: `${year}-08-15`,
    states: ['BY', 'SL'],
    type: 'religious',
    description: 'Assumption of Mary'
  })
  
  // Weltkindertag (World Children's Day) - TH
  holidays.push({
    name: 'Weltkindertag',
    date: `${year}-09-20`,
    states: ['TH'],
    type: 'regional',
    description: 'World Children\'s Day'
  })
  
  // Reformationstag (Reformation Day) - BB, MV, SN, ST, TH + HH, NI, SH (since 2018)
  holidays.push({
    name: 'Reformationstag',
    date: `${year}-10-31`,
    states: ['BB', 'MV', 'SN', 'ST', 'TH', 'HH', 'NI', 'SH'],
    type: 'religious',
    description: 'Reformation Day'
  })
  
  // Allerheiligen (All Saints' Day) - BW, BY, NW, RP, SL
  holidays.push({
    name: 'Allerheiligen',
    date: `${year}-11-01`,
    states: ['BW', 'BY', 'NW', 'RP', 'SL'],
    type: 'religious',
    description: 'All Saints\' Day'
  })
  
  // Buß- und Bettag (Day of Repentance and Prayer) - SN
  const repentanceDay = getRepentanceDay(year)
  holidays.push({
    name: 'Buß- und Bettag',
    date: formatDate(repentanceDay),
    states: ['SN'],
    type: 'religious',
    description: 'Day of Repentance and Prayer'
  })
  
  return holidays
}

/**
 * Calculate Buß- und Bettag (Day of Repentance and Prayer)
 * Always the Wednesday before November 23rd
 */
function getRepentanceDay(year: number): Date {
  const nov23 = new Date(year, 10, 23) // November 23rd
  const dayOfWeek = nov23.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToWednesday = (dayOfWeek + 4) % 7 // Days to subtract to get to previous Wednesday
  const repentanceDay = new Date(nov23)
  repentanceDay.setDate(23 - daysToWednesday)
  return repentanceDay
}

/**
 * Get holidays for a specific German state
 */
export function getHolidaysForState(year: number, stateCode: string): GermanHoliday[] {
  const allHolidays = getGermanHolidays(year)
  return allHolidays.filter(holiday => holiday.states.includes(stateCode))
}

/**
 * Get all federal holidays (apply to all states)
 */
export function getFederalHolidays(year: number): GermanHoliday[] {
  const allHolidays = getGermanHolidays(year)
  return allHolidays.filter(holiday => holiday.type === 'federal')
}

/**
 * Check if a date is a holiday in a specific state
 */
export function isHoliday(date: string, stateCode: string = 'DE'): boolean {
  const year = new Date(date).getFullYear()
  const holidays = stateCode === 'DE' ? getGermanHolidays(year) : getHolidaysForState(year, stateCode)
  return holidays.some(holiday => holiday.date === date)
}

/**
 * Get holiday name for a specific date and state
 */
export function getHolidayName(date: string, stateCode: string = 'DE'): string | null {
  const year = new Date(date).getFullYear()
  const holidays = stateCode === 'DE' ? getGermanHolidays(year) : getHolidaysForState(year, stateCode)
  const holiday = holidays.find(holiday => holiday.date === date)
  return holiday ? holiday.name : null
}

/**
 * Get holidays for multiple years (useful for vacation planning)
 */
export function getMultiYearHolidays(startYear: number, endYear: number, stateCode?: string): GermanHoliday[] {
  const holidays: GermanHoliday[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = stateCode ? getHolidaysForState(year, stateCode) : getGermanHolidays(year)
    holidays.push(...yearHolidays)
  }
  
  return holidays.sort((a, b) => a.date.localeCompare(b.date))
}