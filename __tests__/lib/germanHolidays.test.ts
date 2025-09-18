import {
  calculateEaster,
  getGermanHolidays,
  getHolidaysForState,
  getFederalHolidays,
  isHoliday,
  getHolidayName,
  getMultiYearHolidays,
  GERMAN_STATES
} from '@/lib/germanHolidays'

describe('German Holidays System', () => {
  describe('calculateEaster', () => {
    test('calculates Easter correctly for known years', () => {
      // Known Easter dates for testing
      const knownEasters = [
        { year: 2024, expected: new Date(2024, 2, 31) }, // March 31, 2024
        { year: 2025, expected: new Date(2025, 3, 20) }, // April 20, 2025
        { year: 2026, expected: new Date(2026, 3, 5) },  // April 5, 2026
      ]

      knownEasters.forEach(({ year, expected }) => {
        const calculated = calculateEaster(year)
        expect(calculated.getFullYear()).toBe(expected.getFullYear())
        expect(calculated.getMonth()).toBe(expected.getMonth())
        expect(calculated.getDate()).toBe(expected.getDate())
      })
    })

    test('calculates different dates for different years', () => {
      const easter2024 = calculateEaster(2024)
      const easter2025 = calculateEaster(2025)
      
      expect(easter2024.getTime()).not.toBe(easter2025.getTime())
    })
  })

  describe('getGermanHolidays', () => {
    test('returns all holidays for a given year', () => {
      const holidays = getGermanHolidays(2024)
      
      expect(holidays).toBeInstanceOf(Array)
      expect(holidays.length).toBeGreaterThan(0)
      
      // Check for mandatory federal holidays
      const holidayNames = holidays.map(h => h.name)
      expect(holidayNames).toContain('Neujahr')
      expect(holidayNames).toContain('Tag der Arbeit')
      expect(holidayNames).toContain('Tag der Deutschen Einheit')
      expect(holidayNames).toContain('1. Weihnachtstag')
      expect(holidayNames).toContain('2. Weihnachtstag')
    })

    test('includes Easter-based holidays', () => {
      const holidays = getGermanHolidays(2024)
      const holidayNames = holidays.map(h => h.name)
      
      expect(holidayNames).toContain('Karfreitag')
      expect(holidayNames).toContain('Ostermontag')
      expect(holidayNames).toContain('Christi Himmelfahrt')
      expect(holidayNames).toContain('Pfingstmontag')
    })

    test('includes state-specific holidays', () => {
      const holidays = getGermanHolidays(2024)
      const holidayNames = holidays.map(h => h.name)
      
      expect(holidayNames).toContain('Heilige Drei Könige')
      expect(holidayNames).toContain('Fronleichnam')
      expect(holidayNames).toContain('Reformationstag')
      expect(holidayNames).toContain('Allerheiligen')
    })

    test('all holidays have required properties', () => {
      const holidays = getGermanHolidays(2024)
      
      holidays.forEach(holiday => {
        expect(holiday).toHaveProperty('name')
        expect(holiday).toHaveProperty('date')
        expect(holiday).toHaveProperty('states')
        expect(holiday).toHaveProperty('type')
        expect(holiday).toHaveProperty('description')
        
        expect(typeof holiday.name).toBe('string')
        expect(typeof holiday.date).toBe('string')
        expect(Array.isArray(holiday.states)).toBe(true)
        expect(['federal', 'religious', 'regional']).toContain(holiday.type)
        expect(typeof holiday.description).toBe('string')
        
        // Date format validation (YYYY-MM-DD)
        expect(holiday.date).toMatch(/^\\d{4}-\\d{2}-\\d{2}$/)
      })
    })

    test('dates are sorted chronologically', () => {
      const holidays = getGermanHolidays(2024)
      
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i].date).toBeGreaterThanOrEqual(holidays[i - 1].date)
      }
    })
  })

  describe('getHolidaysForState', () => {
    test('returns holidays specific to Bavaria (BY)', () => {
      const bavarianHolidays = getHolidaysForState(2024, 'BY')
      const holidayNames = bavarianHolidays.map(h => h.name)
      
      // Bavaria has Epiphany and Assumption of Mary
      expect(holidayNames).toContain('Heilige Drei Könige')
      expect(holidayNames).toContain('Mariä Himmelfahrt')
      expect(holidayNames).toContain('Allerheiligen')
    })

    test('returns holidays specific to Berlin (BE)', () => {
      const berlinHolidays = getHolidaysForState(2024, 'BE')
      const holidayNames = berlinHolidays.map(h => h.name)
      
      // Berlin has International Women's Day
      expect(holidayNames).toContain('Internationaler Frauentag')
    })

    test('all returned holidays include the specified state', () => {
      const stateCode = 'NW'
      const stateHolidays = getHolidaysForState(2024, stateCode)
      
      stateHolidays.forEach(holiday => {
        expect(holiday.states).toContain(stateCode)
      })
    })

    test('returns fewer holidays than national list for specific states', () => {
      const allHolidays = getGermanHolidays(2024)
      const berlinHolidays = getHolidaysForState(2024, 'BE')
      
      expect(berlinHolidays.length).toBeLessThanOrEqual(allHolidays.length)
    })
  })

  describe('getFederalHolidays', () => {
    test('returns only federal holidays', () => {
      const federalHolidays = getFederalHolidays(2024)
      
      federalHolidays.forEach(holiday => {
        expect(holiday.type).toBe('federal')
      })
    })

    test('includes all mandatory federal holidays', () => {
      const federalHolidays = getFederalHolidays(2024)
      const holidayNames = federalHolidays.map(h => h.name)
      
      const mandatoryFederal = [
        'Neujahr',
        'Tag der Arbeit',
        'Tag der Deutschen Einheit'
      ]
      
      mandatoryFederal.forEach(name => {
        expect(holidayNames).toContain(name)
      })
    })
  })

  describe('isHoliday', () => {
    test('correctly identifies national holidays', () => {
      expect(isHoliday('2024-01-01')).toBe(true) // New Year
      expect(isHoliday('2024-05-01')).toBe(true) // Labor Day
      expect(isHoliday('2024-10-03')).toBe(true) // German Unity Day
      expect(isHoliday('2024-12-25')).toBe(true) // Christmas
    })

    test('correctly identifies non-holidays', () => {
      expect(isHoliday('2024-01-15')).toBe(false)
      expect(isHoliday('2024-06-15')).toBe(false)
      expect(isHoliday('2024-11-15')).toBe(false)
    })

    test('correctly identifies state-specific holidays', () => {
      // Epiphany is only in BW, BY, ST
      expect(isHoliday('2024-01-06', 'BY')).toBe(true)
      expect(isHoliday('2024-01-06', 'BE')).toBe(false)
      
      // International Women's Day is only in Berlin
      expect(isHoliday('2024-03-08', 'BE')).toBe(true)
      expect(isHoliday('2024-03-08', 'BY')).toBe(false)
    })
  })

  describe('getHolidayName', () => {
    test('returns correct holiday name for known dates', () => {
      expect(getHolidayName('2024-01-01')).toBe('Neujahr')
      expect(getHolidayName('2024-05-01')).toBe('Tag der Arbeit')
      expect(getHolidayName('2024-10-03')).toBe('Tag der Deutschen Einheit')
      expect(getHolidayName('2024-12-25')).toBe('1. Weihnachtstag')
    })

    test('returns null for non-holidays', () => {
      expect(getHolidayName('2024-01-15')).toBeNull()
      expect(getHolidayName('2024-06-15')).toBeNull()
      expect(getHolidayName('2024-11-15')).toBeNull()
    })

    test('handles state-specific holidays correctly', () => {
      expect(getHolidayName('2024-01-06', 'BY')).toBe('Heilige Drei Könige')
      expect(getHolidayName('2024-01-06', 'BE')).toBeNull()
    })
  })

  describe('getMultiYearHolidays', () => {
    test('returns holidays for multiple years', () => {
      const holidays = getMultiYearHolidays(2024, 2025)
      
      expect(holidays).toBeInstanceOf(Array)
      expect(holidays.length).toBeGreaterThan(0)
      
      // Should contain holidays from both years
      const years = [...new Set(holidays.map(h => h.date.substring(0, 4)))]
      expect(years).toContain('2024')
      expect(years).toContain('2025')
    })

    test('returns holidays sorted chronologically across years', () => {
      const holidays = getMultiYearHolidays(2024, 2025)
      
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i].date).toBeGreaterThanOrEqual(holidays[i - 1].date)
      }
    })

    test('filters by state when specified', () => {
      const stateCode = 'BY'
      const holidays = getMultiYearHolidays(2024, 2025, stateCode)
      
      holidays.forEach(holiday => {
        expect(holiday.states).toContain(stateCode)
      })
    })

    test('handles single year range', () => {
      const holidays = getMultiYearHolidays(2024, 2024)
      const years = [...new Set(holidays.map(h => h.date.substring(0, 4)))]
      
      expect(years).toEqual(['2024'])
    })
  })

  describe('GERMAN_STATES constant', () => {
    test('contains all 16 German states', () => {
      expect(Object.keys(GERMAN_STATES)).toHaveLength(16)
    })

    test('has correct state codes and names', () => {
      expect(GERMAN_STATES['BW']).toBe('Baden-Württemberg')
      expect(GERMAN_STATES['BY']).toBe('Bayern')
      expect(GERMAN_STATES['BE']).toBe('Berlin')
      expect(GERMAN_STATES['BB']).toBe('Brandenburg')
      expect(GERMAN_STATES['HB']).toBe('Bremen')
      expect(GERMAN_STATES['HH']).toBe('Hamburg')
      expect(GERMAN_STATES['HE']).toBe('Hessen')
      expect(GERMAN_STATES['MV']).toBe('Mecklenburg-Vorpommern')
      expect(GERMAN_STATES['NI']).toBe('Niedersachsen')
      expect(GERMAN_STATES['NW']).toBe('Nordrhein-Westfalen')
      expect(GERMAN_STATES['RP']).toBe('Rheinland-Pfalz')
      expect(GERMAN_STATES['SL']).toBe('Saarland')
      expect(GERMAN_STATES['SN']).toBe('Sachsen')
      expect(GERMAN_STATES['ST']).toBe('Sachsen-Anhalt')
      expect(GERMAN_STATES['SH']).toBe('Schleswig-Holstein')
      expect(GERMAN_STATES['TH']).toBe('Thüringen')
    })
  })

  describe('Edge cases and error handling', () => {
    test('handles future years correctly', () => {
      const holidays = getGermanHolidays(2030)
      expect(holidays).toBeInstanceOf(Array)
      expect(holidays.length).toBeGreaterThan(0)
    })

    test('handles past years correctly', () => {
      const holidays = getGermanHolidays(2000)
      expect(holidays).toBeInstanceOf(Array)
      expect(holidays.length).toBeGreaterThan(0)
    })

    test('handles invalid state codes gracefully', () => {
      const holidays = getHolidaysForState(2024, 'XX')
      expect(holidays).toEqual([])
    })

    test('handles malformed dates in isHoliday', () => {
      expect(isHoliday('invalid-date')).toBe(false)
      expect(isHoliday('2024-13-01')).toBe(false)
      expect(isHoliday('2024-01-32')).toBe(false)
    })
  })
})