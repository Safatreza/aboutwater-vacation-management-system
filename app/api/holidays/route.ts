import { NextResponse } from 'next/server'

// Static Bavaria holidays to prevent dynamic server usage errors
const bavariaHolidays = [
  {
    id: 1,
    name: 'Weihnachtsferien Vorjahr',
    date: '2024-12-23',
    start_date: '2024-12-23',
    end_date: '2025-01-03',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 2,
    name: 'Faschingsferien',
    date: '2025-03-03',
    start_date: '2025-03-03',
    end_date: '2025-03-07',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 3,
    name: 'Osterferien',
    date: '2025-04-14',
    start_date: '2025-04-14',
    end_date: '2025-04-25',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 4,
    name: 'Pfingstferien',
    date: '2025-06-10',
    start_date: '2025-06-10',
    end_date: '2025-06-20',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 5,
    name: 'Sommerferien',
    date: '2025-08-01',
    start_date: '2025-08-01',
    end_date: '2025-09-15',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 6,
    name: 'Herbstferien',
    date: '2025-11-03',
    start_date: '2025-11-03',
    end_date: '2025-11-07',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 7,
    name: 'Buß-und Bettag',
    date: '2025-11-19',
    start_date: '2025-11-19',
    end_date: '2025-11-19',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 8,
    name: 'Weihnachtsferien dieses Jahr',
    date: '2025-12-22',
    start_date: '2025-12-22',
    end_date: '2026-01-05',
    category: 'Ferien',
    region_code: 'DE'
  },
  {
    id: 9,
    name: 'Neujahr',
    date: '2025-01-01',
    start_date: '2025-01-01',
    end_date: '2025-01-01',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 10,
    name: 'Heilige Drei Könige',
    date: '2025-01-06',
    start_date: '2025-01-06',
    end_date: '2025-01-06',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 11,
    name: 'Karfreitag',
    date: '2025-04-18',
    start_date: '2025-04-18',
    end_date: '2025-04-18',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 12,
    name: 'Ostermontag',
    date: '2025-04-21',
    start_date: '2025-04-21',
    end_date: '2025-04-21',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 13,
    name: 'Tag der Arbeit',
    date: '2025-05-01',
    start_date: '2025-05-01',
    end_date: '2025-05-01',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 14,
    name: 'Christi Himmelfahrt',
    date: '2025-05-29',
    start_date: '2025-05-29',
    end_date: '2025-05-29',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 15,
    name: 'Pfingstmontag',
    date: '2025-06-09',
    start_date: '2025-06-09',
    end_date: '2025-06-09',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 16,
    name: 'Fronleichnam',
    date: '2025-06-19',
    start_date: '2025-06-19',
    end_date: '2025-06-19',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 17,
    name: 'Mariä Himmelfahrt',
    date: '2025-08-15',
    start_date: '2025-08-15',
    end_date: '2025-08-15',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 18,
    name: 'Tag der Deutschen Einheit',
    date: '2025-10-03',
    start_date: '2025-10-03',
    end_date: '2025-10-03',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 19,
    name: 'Allerheiligen',
    date: '2025-11-01',
    start_date: '2025-11-01',
    end_date: '2025-11-01',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 20,
    name: '1. Weihnachtsfeiertag',
    date: '2025-12-25',
    start_date: '2025-12-25',
    end_date: '2025-12-25',
    category: 'Feiertag',
    region_code: 'DE'
  },
  {
    id: 21,
    name: '2. Weihnachtsfeiertag',
    date: '2025-12-26',
    start_date: '2025-12-26',
    end_date: '2025-12-26',
    category: 'Feiertag',
    region_code: 'DE'
  }
]

// Static route to prevent dynamic server usage errors
export async function GET() {
  try {
    const publicHolidays = bavariaHolidays.filter(h => h.category === 'Feiertag')
    const schoolHolidays = bavariaHolidays.filter(h => h.category === 'Ferien')

    return NextResponse.json({
      ok: true,
      total: bavariaHolidays.length,
      public_holidays: publicHolidays,
      public_holidays_count: publicHolidays.length,
      school_holidays: schoolHolidays,
      school_holidays_count: schoolHolidays.length,
      data: bavariaHolidays,
      all_holidays: bavariaHolidays
    })
  } catch (error: any) {
    console.error('❌ HOLIDAYS API ERROR:', error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}