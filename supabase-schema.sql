-- AboutWater GmbH Vacation Management System Database Schema
-- Run this in your Supabase SQL Editor: https://loggvhlcmaipmeeoqifi.supabase.co

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.vacations CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 1. EMPLOYEES TABLE
CREATE TABLE public.employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  allowance_days DECIMAL(4,1) NOT NULL DEFAULT 30.0,
  used_vacation_days DECIMAL(4,1) DEFAULT 0.0,
  remaining_vacation DECIMAL(4,1) GENERATED ALWAYS AS (allowance_days - COALESCE(used_vacation_days, 0)) STORED,
  region_code VARCHAR(10) DEFAULT 'DE-BY', -- German regions: DE-BY, DE-BW, DE-BE, etc.
  active BOOLEAN DEFAULT true,
  color VARCHAR(7), -- Hex color code #FFFFFF
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. VACATIONS TABLE
CREATE TABLE public.vacations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days DECIMAL(3,1) NOT NULL, -- Number of working days in this vacation
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_working_days CHECK (working_days > 0)
);

-- 3. HOLIDAYS TABLE (German public holidays by region)
CREATE TABLE public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  region_code VARCHAR(10) NOT NULL, -- DE-BY, DE-BW, DE-BE, etc.
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  source VARCHAR(50) DEFAULT 'system', -- 'system', 'google_calendar', 'manual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one holiday per date per region
  UNIQUE(region_code, date, name)
);

-- 4. SETTINGS TABLE (Application configuration)
CREATE TABLE public.settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_employees_active ON public.employees(active);
CREATE INDEX idx_employees_region ON public.employees(region_code);
CREATE INDEX idx_vacations_employee ON public.vacations(employee_id);
CREATE INDEX idx_vacations_dates ON public.vacations(start_date, end_date);
CREATE INDEX idx_vacations_year ON public.vacations(EXTRACT(year FROM start_date));
CREATE INDEX idx_holidays_region_date ON public.holidays(region_code, date);
CREATE INDEX idx_holidays_date ON public.holidays(date);

-- TRIGGERS for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_employees
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_vacations
    BEFORE UPDATE ON public.vacations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_holidays
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_settings
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- SEED DATA: Insert current employees from sharedData.ts
INSERT INTO public.employees (id, name, allowance_days, used_vacation_days, color, region_code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Andreas Pöppe', 38.0, 28.5, '#FF0000', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000002', 'Anna Kropfitsch', 0.0, 0.0, '#0000FF', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000003', 'Antonio Svagusa', 26.0, 24.0, '#008000', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000004', 'Carmen Berger', 40.0, 22.0, '#FF8000', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000005', 'Cengiz Kina', 0.0, 0.0, '#800080', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000006', 'Christian Irrgang', 34.0, 28.0, '#008080', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000007', 'Daniel Hegemann', 32.0, 29.0, '#8B4513', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000008', 'Estaline Philander', 30.0, 22.0, '#FF1493', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000009', 'Farouk Chasan', 32.5, 28.0, '#000080', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000010', 'Florian Gräf', 47.0, 27.0, '#800000', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000011', 'Giorgi Lomidze', 30.0, 0.0, '#2F4F4F', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000012', 'Hannes Kolm', 33.0, 24.0, '#B22222', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000013', 'Josefine Mättig', 29.0, 29.0, '#228B22', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000014', 'Matthias Herbst', 36.0, 23.0, '#4B0082', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000015', 'Max Sanktjohanser', 30.0, 23.0, '#DC143C', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000016', 'Michael Reiser', 20.0, 19.5, '#00CED1', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000017', 'Mihaela Abmayr', 27.0, 19.0, '#FF6347', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000018', 'Petra Gräf', 35.0, 21.0, '#4682B4', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000019', 'René Kühn', 32.5, 28.0, '#D2691E', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000020', 'Safat Majumder', 30.0, 7.0, '#FF4500', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000021', 'Sönke Rocho', 41.0, 31.0, '#8B008B', 'DE-BY'),
  ('00000000-0000-0000-0000-000000000022', 'Thierry Brunner', 37.0, 28.0, '#556B2F', 'DE-BY');

-- SEED DATA: Basic German holidays for Bavaria (2024-2025)
INSERT INTO public.holidays (region_code, date, name, source) VALUES
  ('DE-BY', '2024-01-01', 'Neujahr', 'system'),
  ('DE-BY', '2024-01-06', 'Heilige Drei Könige', 'system'),
  ('DE-BY', '2024-03-29', 'Karfreitag', 'system'),
  ('DE-BY', '2024-04-01', 'Ostermontag', 'system'),
  ('DE-BY', '2024-05-01', 'Tag der Arbeit', 'system'),
  ('DE-BY', '2024-05-09', 'Christi Himmelfahrt', 'system'),
  ('DE-BY', '2024-05-20', 'Pfingstmontag', 'system'),
  ('DE-BY', '2024-05-30', 'Fronleichnam', 'system'),
  ('DE-BY', '2024-08-15', 'Mariä Himmelfahrt', 'system'),
  ('DE-BY', '2024-10-03', 'Tag der Deutschen Einheit', 'system'),
  ('DE-BY', '2024-11-01', 'Allerheiligen', 'system'),
  ('DE-BY', '2024-12-25', '1. Weihnachtsfeiertag', 'system'),
  ('DE-BY', '2024-12-26', '2. Weihnachtsfeiertag', 'system'),

  -- 2025 holidays
  ('DE-BY', '2025-01-01', 'Neujahr', 'system'),
  ('DE-BY', '2025-01-06', 'Heilige Drei Könige', 'system'),
  ('DE-BY', '2025-04-18', 'Karfreitag', 'system'),
  ('DE-BY', '2025-04-21', 'Ostermontag', 'system'),
  ('DE-BY', '2025-05-01', 'Tag der Arbeit', 'system'),
  ('DE-BY', '2025-05-29', 'Christi Himmelfahrt', 'system'),
  ('DE-BY', '2025-06-09', 'Pfingstmontag', 'system'),
  ('DE-BY', '2025-06-19', 'Fronleichnam', 'system'),
  ('DE-BY', '2025-08-15', 'Mariä Himmelfahrt', 'system'),
  ('DE-BY', '2025-10-03', 'Tag der Deutschen Einheit', 'system'),
  ('DE-BY', '2025-11-01', 'Allerheiligen', 'system'),
  ('DE-BY', '2025-12-25', '1. Weihnachtsfeiertag', 'system'),
  ('DE-BY', '2025-12-26', '2. Weihnachtsfeiertag', 'system');

-- SEED DATA: Default application settings
INSERT INTO public.settings (key, value, description) VALUES
  ('app_version', '2.0.0', 'Current application version'),
  ('default_region', 'DE-BY', 'Default region for new employees'),
  ('vacation_year_start', '01-01', 'Start of vacation year (MM-DD)'),
  ('max_vacation_days', '50', 'Maximum vacation days per employee'),
  ('business_days_only', 'true', 'Count only business days for vacations'),
  ('notification_email', 'vacation@aboutwater.de', 'Email for vacation notifications'),
  ('backup_retention_days', '90', 'Days to retain backup data');

-- Enable Row Level Security (RLS) - Currently permissive for development
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (modify for production)
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on vacations" ON public.vacations FOR ALL USING (true);
CREATE POLICY "Allow all operations on holidays" ON public.holidays FOR ALL USING (true);
CREATE POLICY "Allow all operations on settings" ON public.settings FOR ALL USING (true);

-- VERIFICATION QUERIES (uncomment to test)
-- SELECT 'Employees count:', COUNT(*) FROM public.employees;
-- SELECT 'Vacations count:', COUNT(*) FROM public.vacations;
-- SELECT 'Holidays count:', COUNT(*) FROM public.holidays;
-- SELECT 'Settings count:', COUNT(*) FROM public.settings;

-- SUCCESS MESSAGE
SELECT 'SUCCESS: AboutWater Vacation Management Database Schema created!' as status;