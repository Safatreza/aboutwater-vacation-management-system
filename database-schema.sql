-- AboutWater GmbH Vacation Dashboard - Complete Database Schema
-- Execute this script in your Supabase SQL Editor
-- Project URL: https://loggvhlcmaipmeeoqifi.supabase.co

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    allowance_days INTEGER NOT NULL DEFAULT 25,
    region_code VARCHAR(10) NOT NULL DEFAULT 'DE',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT employees_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT employees_allowance_positive CHECK (allowance_days > 0),
    CONSTRAINT employees_allowance_reasonable CHECK (allowance_days <= 50)
);

-- 2. VACATIONS TABLE
CREATE TABLE IF NOT EXISTS public.vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    note TEXT,
    working_days INTEGER NOT NULL DEFAULT 1,
    type VARCHAR(50) DEFAULT 'vacation',
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT vacations_date_order CHECK (start_date <= end_date),
    CONSTRAINT vacations_working_days_positive CHECK (working_days > 0),
    CONSTRAINT vacations_working_days_reasonable CHECK (working_days <= 50),
    CONSTRAINT vacations_future_dates CHECK (start_date >= '2020-01-01'),
    CONSTRAINT vacations_reasonable_dates CHECK (end_date <= '2030-12-31')
);

-- 3. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code VARCHAR(10) NOT NULL DEFAULT 'DE',
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    source VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT holidays_date_not_null CHECK (date IS NOT NULL),
    CONSTRAINT holidays_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT holidays_future_dates CHECK (date >= '2020-01-01'),
    CONSTRAINT holidays_reasonable_dates CHECK (date <= '2030-12-31')
);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT settings_key_not_empty CHECK (LENGTH(TRIM(key)) > 0)
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(name);
CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON public.vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_dates ON public.vacations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vacations_employee_dates ON public.vacations(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holidays_region_date ON public.holidays(region_code, date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_region_date_unique ON public.holidays(region_code, date);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);

-- SETUP ROW LEVEL SECURITY (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES (Allow all operations for authenticated users)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow all operations on employees" ON public.employees;
    DROP POLICY IF EXISTS "Allow all operations on vacations" ON public.vacations;
    DROP POLICY IF EXISTS "Allow all operations on holidays" ON public.holidays;
    DROP POLICY IF EXISTS "Allow all operations on settings" ON public.settings;

    -- Create permissive policies for all operations
    CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true);
    CREATE POLICY "Allow all operations on vacations" ON public.vacations FOR ALL USING (true);
    CREATE POLICY "Allow all operations on holidays" ON public.holidays FOR ALL USING (true);
    CREATE POLICY "Allow all operations on settings" ON public.settings FOR ALL USING (true);
END $$;

-- INSERT DEFAULT SETTINGS
INSERT INTO public.settings (key, value, description) VALUES
    ('app_name', 'AboutWater Vacation Dashboard', 'Application name'),
    ('default_vacation_days', '25', 'Default vacation days for new employees'),
    ('company_region', 'DE', 'Default company region for holidays')
ON CONFLICT (key) DO NOTHING;

-- INSERT SAMPLE EMPLOYEES (Optional - for testing)
INSERT INTO public.employees (name, email, allowance_days, region_code) VALUES
    ('Max Mustermann', 'max.mustermann@aboutwater.de', 25, 'DE'),
    ('Anna Schmidt', 'anna.schmidt@aboutwater.de', 27, 'DE'),
    ('Thomas Weber', 'thomas.weber@aboutwater.de', 30, 'DE')
ON CONFLICT DO NOTHING;

-- VERIFICATION QUERIES
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('employees', 'vacations', 'holidays', 'settings');
SELECT COUNT(*) as employee_count FROM public.employees;
SELECT COUNT(*) as holiday_count FROM public.holidays;

-- END OF SCHEMA CREATION