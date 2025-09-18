-- AboutWater GmbH Vacation Management System
-- Complete Database Schema Creation
-- Version: 1.0.0
-- Created: 2024-01-13

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EMPLOYEES TABLE
-- Stores employee information and vacation allowances
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    allowance_days NUMERIC(5,1) NOT NULL DEFAULT 25.0,
    used_days NUMERIC(5,1) NOT NULL DEFAULT 0.0,
    remaining_days NUMERIC(5,1) GENERATED ALWAYS AS (allowance_days - used_days) STORED,
    region_code TEXT DEFAULT 'DE',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT employees_allowance_days_positive CHECK (allowance_days >= 0),
    CONSTRAINT employees_used_days_positive CHECK (used_days >= 0),
    CONSTRAINT employees_used_days_not_exceed_allowance CHECK (used_days <= allowance_days),
    CONSTRAINT employees_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_region_code ON employees(region_code);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- =====================================================
-- VACATIONS TABLE
-- Stores vacation requests and approvals
-- =====================================================
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days NUMERIC(5,1) GENERATED ALWAYS AS (
        CASE 
            WHEN start_date IS NOT NULL AND end_date IS NOT NULL 
            THEN (end_date - start_date + 1)::NUMERIC 
            ELSE 0 
        END
    ) STORED,
    type TEXT NOT NULL DEFAULT 'annual_leave',
    status TEXT NOT NULL DEFAULT 'approved',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vacations_end_date_after_start_date CHECK (end_date >= start_date),
    CONSTRAINT vacations_type_valid CHECK (type IN ('annual_leave', 'sick_leave', 'personal_leave', 'maternity_leave', 'paternity_leave', 'other')),
    CONSTRAINT vacations_status_valid CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    CONSTRAINT vacations_start_date_not_past CHECK (start_date >= CURRENT_DATE - INTERVAL '1 year'),
    CONSTRAINT vacations_end_date_reasonable CHECK (end_date <= CURRENT_DATE + INTERVAL '2 years')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_start_date ON vacations(start_date);
CREATE INDEX IF NOT EXISTS idx_vacations_end_date ON vacations(end_date);
CREATE INDEX IF NOT EXISTS idx_vacations_status ON vacations(status);
CREATE INDEX IF NOT EXISTS idx_vacations_date_range ON vacations(start_date, end_date);

-- =====================================================
-- HOLIDAYS TABLE
-- Stores German public holidays by region
-- =====================================================
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code TEXT NOT NULL DEFAULT 'DE',
    date DATE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'public',
    source TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT holidays_source_valid CHECK (source IN ('google', 'system', 'company', 'manual')),
    CONSTRAINT holidays_type_valid CHECK (type IN ('public', 'regional', 'company', 'optional')),
    CONSTRAINT holidays_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT holidays_region_code_valid CHECK (region_code ~ '^[A-Z]{2}$'),
    
    -- Unique constraint to prevent duplicate holidays
    UNIQUE(region_code, date, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_holidays_region_code ON holidays(region_code);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_source ON holidays(source);
CREATE INDEX IF NOT EXISTS idx_holidays_date_range ON holidays(date, region_code);

-- =====================================================
-- SETTINGS TABLE
-- Stores application configuration and preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    default_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    default_region_code TEXT DEFAULT 'DE',
    default_allowance_days NUMERIC(5,1) DEFAULT 25.0,
    company_name TEXT DEFAULT 'AboutWater GmbH',
    notification_email TEXT DEFAULT 'safat.majumder@aboutwater.de',
    backup_frequency_days INTEGER DEFAULT 7,
    auto_sync_holidays BOOLEAN DEFAULT true,
    last_holiday_sync_at TIMESTAMPTZ,
    last_backup_at TIMESTAMPTZ,
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one settings record
    CONSTRAINT settings_single_row CHECK (id = 1),
    CONSTRAINT settings_year_reasonable CHECK (default_year >= 2020 AND default_year <= 2050),
    CONSTRAINT settings_allowance_positive CHECK (default_allowance_days > 0),
    CONSTRAINT settings_backup_frequency_positive CHECK (backup_frequency_days > 0)
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vacations_updated_at 
    BEFORE UPDATE ON vacations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER holidays_updated_at 
    BEFORE UPDATE ON holidays 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update employee used_days when vacations change
CREATE OR REPLACE FUNCTION update_employee_used_days()
RETURNS TRIGGER AS $$
BEGIN
    -- Update used_days for the affected employee
    UPDATE employees 
    SET used_days = (
        SELECT COALESCE(SUM(days), 0)
        FROM vacations 
        WHERE employee_id = COALESCE(NEW.employee_id, OLD.employee_id)
          AND status = 'approved'
          AND type = 'annual_leave'
          AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    )
    WHERE id = COALESCE(NEW.employee_id, OLD.employee_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update used_days
CREATE TRIGGER update_employee_used_days_trigger
    AFTER INSERT OR UPDATE OR DELETE ON vacations
    FOR EACH ROW EXECUTE FUNCTION update_employee_used_days();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY employees_policy ON employees FOR ALL USING (true);
CREATE POLICY vacations_policy ON vacations FOR ALL USING (true);
CREATE POLICY holidays_policy ON holidays FOR ALL USING (true);
CREATE POLICY settings_policy ON settings FOR ALL USING (true);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default settings
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert some basic German federal holidays for 2024 and 2025
INSERT INTO holidays (region_code, date, name, type, source) VALUES
    -- 2024 Federal Holidays
    ('DE', '2024-01-01', 'Neujahr', 'public', 'system'),
    ('DE', '2024-03-29', 'Karfreitag', 'public', 'system'),
    ('DE', '2024-04-01', 'Ostermontag', 'public', 'system'),
    ('DE', '2024-05-01', 'Tag der Arbeit', 'public', 'system'),
    ('DE', '2024-05-09', 'Christi Himmelfahrt', 'public', 'system'),
    ('DE', '2024-05-20', 'Pfingstmontag', 'public', 'system'),
    ('DE', '2024-10-03', 'Tag der Deutschen Einheit', 'public', 'system'),
    ('DE', '2024-12-25', '1. Weihnachtstag', 'public', 'system'),
    ('DE', '2024-12-26', '2. Weihnachtstag', 'public', 'system'),
    
    -- 2025 Federal Holidays
    ('DE', '2025-01-01', 'Neujahr', 'public', 'system'),
    ('DE', '2025-04-18', 'Karfreitag', 'public', 'system'),
    ('DE', '2025-04-21', 'Ostermontag', 'public', 'system'),
    ('DE', '2025-05-01', 'Tag der Arbeit', 'public', 'system'),
    ('DE', '2025-05-29', 'Christi Himmelfahrt', 'public', 'system'),
    ('DE', '2025-06-09', 'Pfingstmontag', 'public', 'system'),
    ('DE', '2025-10-03', 'Tag der Deutschen Einheit', 'public', 'system'),
    ('DE', '2025-12-25', '1. Weihnachtstag', 'public', 'system'),
    ('DE', '2025-12-26', '2. Weihnachtstag', 'public', 'system')
ON CONFLICT (region_code, date, name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('employees', 'vacations', 'holidays', 'settings');
    
    RAISE NOTICE 'Created % tables successfully', table_count;
    
    IF table_count != 4 THEN
        RAISE EXCEPTION 'Expected 4 tables, but found %', table_count;
    END IF;
END $$;

-- Display final status
SELECT 
    'AboutWater GmbH Vacation Management Database' as system,
    'Schema created successfully' as status,
    NOW() as created_at,
    (SELECT COUNT(*) FROM employees) as employee_count,
    (SELECT COUNT(*) FROM holidays) as holiday_count,
    (SELECT version FROM settings WHERE id = 1) as version;