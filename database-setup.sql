-- =====================================================
-- AboutWater GmbH Vacation Management Database Setup
-- =====================================================
--
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard
-- 2. Open your project
-- 3. Go to SQL Editor
-- 4. Run this script to create tables
-- =====================================================

-- Drop existing tables if they exist (CAUTION: This will delete all data!)
DROP TABLE IF EXISTS vacations;
DROP TABLE IF EXISTS employees;

-- =====================================================
-- EMPLOYEES TABLE
-- =====================================================
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  allowance_days DECIMAL DEFAULT 25,
  used_days DECIMAL DEFAULT 0,
  remaining_days DECIMAL DEFAULT 25,
  color_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- VACATIONS TABLE
-- =====================================================
CREATE TABLE vacations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count DECIMAL NOT NULL,
  reason TEXT DEFAULT 'Urlaub (ganzer Tag)',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SECURITY POLICIES (Enable Row Level Security)
-- =====================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (can be restricted later)
CREATE POLICY "Allow all access to employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all access to vacations" ON vacations FOR ALL USING (true);

-- =====================================================
-- INSERT INITIAL EMPLOYEE DATA
-- =====================================================
INSERT INTO employees (name, allowance_days, used_days, remaining_days, color_code) VALUES
('Andreas Pöppe', 38.0, 28.5, 9.5, '#FF0000'),
('Anna Kropfitsch', 0.0, 0.0, 0.0, '#0000FF'),
('Antonio Svagusa', 26.0, 24.0, 2.0, '#008000'),
('Carmen Berger', 40.0, 22.0, 18.0, '#FF8000'),
('Cengiz Kina', 0.0, 0.0, 0.0, '#800080'),
('Christian Irrgang', 34.0, 28.0, 6.0, '#008080'),
('Daniel Hegemann', 32.0, 29.0, 3.0, '#8B4513'),
('Estaline Philander', 30.0, 22.0, 8.0, '#FF1493'),
('Farouk Chasan', 32.5, 28.0, 4.5, '#000080'),
('Florian Gräf', 47.0, 27.0, 20.0, '#800000'),
('Giorgi Lomidze', 30.0, 0.0, 30.0, '#2F4F4F'),
('Hannes Kolm', 33.0, 24.0, 9.0, '#B22222'),
('Josefine Mättig', 29.0, 29.0, 0.0, '#228B22'),
('Matthias Herbst', 36.0, 23.0, 13.0, '#4B0082'),
('Max Sanktjohanser', 30.0, 23.0, 7.0, '#DC143C'),
('Michael Reiser', 20.0, 19.5, 0.5, '#00CED1'),
('Mihaela Abmayr', 27.0, 19.0, 8.0, '#FF6347'),
('Petra Gräf', 35.0, 21.0, 14.0, '#4682B4'),
('René Kühn', 32.5, 28.0, 4.5, '#D2691E'),
('Sönke Rocho', 41.0, 31.0, 10.0, '#8B008B'),
('Thierry Brunner', 37.0, 28.0, 9.0, '#556B2F'),
('Safat Majumder', 30.0, 7.0, 23.0, '#FF4500');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup worked:

-- Check employees table
SELECT COUNT(*) as employee_count FROM employees;

-- Check vacations table
SELECT COUNT(*) as vacation_count FROM vacations;

-- Show all employees
SELECT name, allowance_days, used_days, remaining_days, color_code FROM employees ORDER BY name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If no errors appeared above, your database is ready!
-- The AboutWater vacation management system can now store data permanently.