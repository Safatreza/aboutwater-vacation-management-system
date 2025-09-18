-- Workbook Parity System Schema
-- Creates tables for exact Excel workbook behavior matching

-- ================================
-- HOLIDAY RANGES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS holiday_ranges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                              -- Bezeichnung
  start_date DATE NOT NULL,                        -- Von (inclusive)
  end_date DATE NOT NULL,                          -- Bis (inclusive)
  category TEXT NOT NULL CHECK (category IN ('Ferien', 'Feiertag', 'Betriebsschließung')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_holiday_ranges_dates ON holiday_ranges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holiday_ranges_category ON holiday_ranges(category);

-- ================================
-- LEAVE CODES TABLE (Konfig)
-- ================================

CREATE TABLE IF NOT EXISTS leave_codes (
  code TEXT PRIMARY KEY,                           -- "U", "U2", "G", "G2", "S", "UU"
  description TEXT NOT NULL,                       -- from Konfig
  value_vacation DECIMAL(3,1) DEFAULT 0 NOT NULL, -- Urlaubstage
  value_comp DECIMAL(3,1) DEFAULT 0 NOT NULL,     -- Gleittage
  value_special DECIMAL(3,1) DEFAULT 0 NOT NULL,  -- Sondertage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================
-- WORKBOOK EMPLOYEES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS workbook_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                              -- Column A
  carryover_prev_year DECIMAL(4,1) DEFAULT 0 NOT NULL, -- Column B - manual input
  allowance_current_year DECIMAL(4,1) DEFAULT 25 NOT NULL, -- Column C - manual input
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workbook_employees_active ON workbook_employees(active);
CREATE INDEX IF NOT EXISTS idx_workbook_employees_name ON workbook_employees(name);

-- ================================
-- EMPLOYEE DAILY CODES TABLE
-- ================================

CREATE TABLE IF NOT EXISTS employee_daily_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES workbook_employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,                           -- Fixed to 2025 for this implementation
  day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index < 365), -- 0-364 for 2025
  code TEXT,                                       -- "U", "U2", "G", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one code per employee per day per year
  UNIQUE(employee_id, year, day_index)
);

CREATE INDEX IF NOT EXISTS idx_employee_daily_codes_lookup ON employee_daily_codes(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_employee_daily_codes_date ON employee_daily_codes(year, day_index);

-- ================================
-- TRIGGERS FOR UPDATED_AT
-- ================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_holiday_ranges_updated_at
  BEFORE UPDATE ON holiday_ranges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_codes_updated_at
  BEFORE UPDATE ON leave_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workbook_employees_updated_at
  BEFORE UPDATE ON workbook_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_daily_codes_updated_at
  BEFORE UPDATE ON employee_daily_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- INSERT CANONICAL LEAVE CODES
-- ================================

INSERT INTO leave_codes (code, description, value_vacation, value_comp, value_special) VALUES
  ('U',  'Urlaub',            1.0, 0.0, 0.0),
  ('U2', 'Halber Urlaub',     0.5, 0.0, 0.0),
  ('G',  'Gleittag',          0.0, 1.0, 0.0),
  ('G2', 'Halber Gleittag',   0.0, 0.5, 0.0),
  ('S',  'Sondertag',         0.0, 0.0, 1.0),
  ('UU', 'Unbezahlter Urlaub', 0.0, 0.0, 1.0)
ON CONFLICT (code) DO NOTHING;

-- ================================
-- SAMPLE HOLIDAY RANGES FOR BAVARIA (DE-BY) 2025
-- ================================

INSERT INTO holiday_ranges (name, start_date, end_date, category) VALUES
  -- Feiertage (Public Holidays)
  ('Neujahr', '2025-01-01', '2025-01-01', 'Feiertag'),
  ('Heilige Drei Könige', '2025-01-06', '2025-01-06', 'Feiertag'),
  ('Karfreitag', '2025-04-18', '2025-04-18', 'Feiertag'),
  ('Ostermontag', '2025-04-21', '2025-04-21', 'Feiertag'),
  ('Tag der Arbeit', '2025-05-01', '2025-05-01', 'Feiertag'),
  ('Christi Himmelfahrt', '2025-05-29', '2025-05-29', 'Feiertag'),
  ('Pfingstmontag', '2025-06-09', '2025-06-09', 'Feiertag'),
  ('Fronleichnam', '2025-06-19', '2025-06-19', 'Feiertag'),
  ('Mariä Himmelfahrt', '2025-08-15', '2025-08-15', 'Feiertag'),
  ('Tag der Deutschen Einheit', '2025-10-03', '2025-10-03', 'Feiertag'),
  ('Allerheiligen', '2025-11-01', '2025-11-01', 'Feiertag'),
  ('Weihnachten', '2025-12-25', '2025-12-25', 'Feiertag'),
  ('2. Weihnachtstag', '2025-12-26', '2025-12-26', 'Feiertag'),

  -- Ferien (School Breaks / Holidays) - Bavaria 2025
  ('Weihnachtsferien', '2025-01-02', '2025-01-03', 'Ferien'),
  ('Faschingsferien', '2025-03-03', '2025-03-07', 'Ferien'),
  ('Osterferien', '2025-04-14', '2025-04-25', 'Ferien'),
  ('Pfingstferien', '2025-06-10', '2025-06-20', 'Ferien'),
  ('Sommerferien', '2025-07-28', '2025-09-12', 'Ferien'),
  ('Herbstferien', '2025-10-27', '2025-10-31', 'Ferien'),
  ('Weihnachtsferien 2025', '2025-12-22', '2025-12-31', 'Ferien'),

  -- Betriebsschließung (Company Closures) - Example
  ('Betriebsurlaub Sommer', '2025-08-04', '2025-08-15', 'Betriebsschließung'),
  ('Brückentage', '2025-05-30', '2025-05-30', 'Betriebsschließung'),
  ('Brückentag nach Weihnachten', '2025-12-29', '2025-12-31', 'Betriebsschließung')
ON CONFLICT DO NOTHING;

-- ================================
-- VIEWS FOR REPORTING
-- ================================

-- View for employee reports with calculated totals
CREATE OR REPLACE VIEW employee_reports AS
SELECT
  we.id as employee_id,
  we.name,
  we.carryover_prev_year,
  we.allowance_current_year,
  COALESCE(vacation_totals.used_vacation, 0) as used_vacation,
  COALESCE(vacation_totals.comp_days, 0) as comp_days,
  COALESCE(vacation_totals.special_days, 0) as special_days,
  (we.carryover_prev_year + we.allowance_current_year - COALESCE(vacation_totals.used_vacation, 0)) as remaining_vacation
FROM workbook_employees we
LEFT JOIN (
  SELECT
    edc.employee_id,
    SUM(lc.value_vacation) as used_vacation,
    SUM(lc.value_comp) as comp_days,
    SUM(lc.value_special) as special_days
  FROM employee_daily_codes edc
  JOIN leave_codes lc ON edc.code = lc.code
  WHERE edc.year = 2025
  GROUP BY edc.employee_id
) vacation_totals ON we.id = vacation_totals.employee_id
WHERE we.active = true;

-- Comments for documentation
COMMENT ON TABLE holiday_ranges IS 'Holiday ranges for visual flags - Ferien/Feiertag/Betriebsschließung';
COMMENT ON TABLE leave_codes IS 'Leave code mappings from Konfig sheet - U/U2/G/G2/S/UU with values';
COMMENT ON TABLE workbook_employees IS 'Employee master data with carryover and current year allowances';
COMMENT ON TABLE employee_daily_codes IS 'Daily leave codes per employee - 365 days per year';
COMMENT ON VIEW employee_reports IS 'Calculated employee vacation reports matching workbook totals';