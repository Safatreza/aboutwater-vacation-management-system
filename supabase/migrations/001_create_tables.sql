-- aboutwater GmbH Vacation Management System
-- Database Schema Migration
-- 
-- This creates the core tables needed for the vacation management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    allowance_days INTEGER NOT NULL DEFAULT 25,
    region_code TEXT NOT NULL DEFAULT 'DE',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create vacations table
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    note TEXT,
    working_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (start_date <= end_date),
    CONSTRAINT positive_working_days CHECK (working_days >= 0)
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code TEXT NOT NULL DEFAULT 'DE',
    date DATE NOT NULL,
    name TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'google',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Ensure no duplicate holidays for same region and date
    UNIQUE(region_code, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active);
CREATE INDEX IF NOT EXISTS idx_employees_region ON employees(region_code);
CREATE INDEX IF NOT EXISTS idx_vacations_employee ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_dates ON vacations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_region ON holidays(region_code);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacations_updated_at BEFORE UPDATE ON vacations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to prevent overlapping vacations
CREATE OR REPLACE FUNCTION check_vacation_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping vacations for the same employee
    IF EXISTS (
        SELECT 1 FROM vacations 
        WHERE employee_id = NEW.employee_id 
        AND id != COALESCE(NEW.id, uuid_generate_v4())
        AND (
            (NEW.start_date <= end_date AND NEW.end_date >= start_date)
        )
    ) THEN
        RAISE EXCEPTION 'Vacation dates overlap with existing vacation for this employee';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to prevent overlaps
CREATE TRIGGER prevent_vacation_overlap 
    BEFORE INSERT OR UPDATE ON vacations
    FOR EACH ROW EXECUTE FUNCTION check_vacation_overlap();

-- Insert sample data for testing (optional)
INSERT INTO employees (name, allowance_days, region_code) VALUES
    ('Max Mustermann', 25, 'DE'),
    ('Anna Schmidt', 28, 'DE'),
    ('Thomas Weber', 30, 'DE')
ON CONFLICT DO NOTHING;

-- Insert sample German holidays for 2024 and 2025
INSERT INTO holidays (region_code, date, name, source) VALUES
    ('DE', '2024-01-01', 'Neujahr', 'system'),
    ('DE', '2024-05-01', 'Tag der Arbeit', 'system'),
    ('DE', '2024-10-03', 'Tag der Deutschen Einheit', 'system'),
    ('DE', '2024-12-25', 'Weihnachten', 'system'),
    ('DE', '2024-12-26', '2. Weihnachtstag', 'system'),
    
    ('DE', '2025-01-01', 'Neujahr', 'system'),
    ('DE', '2025-05-01', 'Tag der Arbeit', 'system'),
    ('DE', '2025-10-03', 'Tag der Deutschen Einheit', 'system'),
    ('DE', '2025-12-25', 'Weihnachten', 'system'),
    ('DE', '2025-12-26', '2. Weihnachtstag', 'system')
ON CONFLICT (region_code, date) DO NOTHING;

-- Create RLS (Row Level Security) policies if needed
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust as needed for production)
CREATE POLICY "Enable all operations for authenticated users" ON employees FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON vacations FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON holidays FOR ALL USING (true);

-- Create a view for employee vacation summaries
CREATE OR REPLACE VIEW employee_vacation_summary AS
SELECT 
    e.id,
    e.name,
    e.allowance_days,
    e.region_code,
    e.active,
    COALESCE(SUM(
        CASE 
            WHEN v.start_date IS NOT NULL 
            AND EXTRACT(YEAR FROM v.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN v.working_days 
            ELSE 0 
        END
    ), 0) as used_days_current_year,
    e.allowance_days - COALESCE(SUM(
        CASE 
            WHEN v.start_date IS NOT NULL 
            AND EXTRACT(YEAR FROM v.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN v.working_days 
            ELSE 0 
        END
    ), 0) as remaining_days_current_year
FROM employees e
LEFT JOIN vacations v ON e.id = v.employee_id
WHERE e.active = true
GROUP BY e.id, e.name, e.allowance_days, e.region_code, e.active;