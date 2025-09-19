// HYBRID STORAGE SYSTEM - Supabase with localStorage Fallback
// Ensures app works with or without database connection

import { createClient } from '@supabase/supabase-js';

let supabase = null;
let useLocalStorage = false;
let connectionTested = false;

// Initialize Supabase with error handling
const initializeSupabase = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client initialized');
      return true;
    } else {
      console.warn('⚠️ Supabase environment variables missing - using localStorage fallback');
      useLocalStorage = true;
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase initialization failed:', error);
    useLocalStorage = true;
    return false;
  }
};

// Test database connection
export const testConnection = async () => {
  if (typeof window === 'undefined') {
    return false; // Skip during SSR/build
  }

  if (connectionTested && useLocalStorage) {
    return false;
  }

  if (!supabase) {
    const initialized = initializeSupabase();
    if (!initialized) return false;
  }

  try {
    const { data, error } = await supabase.from('employees').select('count', { count: 'exact' }).limit(1);
    if (error) throw error;

    console.log('✅ Database connection successful');
    connectionTested = true;
    useLocalStorage = false;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('🔄 Falling back to localStorage');
    useLocalStorage = true;
    connectionTested = true;
    return false;
  }
};

// Storage key constants
const STORAGE_KEYS = {
  EMPLOYEES: 'vacation-employees-2025',
  VACATIONS: 'vacation-entries-2025'
};

// Default employee data
const getDefaultEmployees = () => [
  { id: '1', name: 'Andreas Pöppe', allowance: 38.0, used: 28.5, remaining: 9.5, color: '#FF0000' },
  { id: '2', name: 'Anna Kropfitsch', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#0000FF' },
  { id: '3', name: 'Antonio Svagusa', allowance: 26.0, used: 24.0, remaining: 2.0, color: '#008000' },
  { id: '4', name: 'Carmen Berger', allowance: 40.0, used: 22.0, remaining: 18.0, color: '#FF8000' },
  { id: '5', name: 'Cengiz Kina', allowance: 0.0, used: 0.0, remaining: 0.0, color: '#800080' },
  { id: '6', name: 'Christian Irrgang', allowance: 34.0, used: 28.0, remaining: 6.0, color: '#008080' },
  { id: '7', name: 'Daniel Hegemann', allowance: 32.0, used: 29.0, remaining: 3.0, color: '#8B4513' },
  { id: '8', name: 'Estaline Philander', allowance: 30.0, used: 22.0, remaining: 8.0, color: '#FF1493' },
  { id: '9', name: 'Farouk Chasan', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#000080' },
  { id: '10', name: 'Florian Gräf', allowance: 47.0, used: 27.0, remaining: 20.0, color: '#800000' },
  { id: '11', name: 'Giorgi Lomidze', allowance: 30.0, used: 0.0, remaining: 30.0, color: '#2F4F4F' },
  { id: '12', name: 'Hannes Kolm', allowance: 33.0, used: 24.0, remaining: 9.0, color: '#B22222' },
  { id: '13', name: 'Josefine Mättig', allowance: 29.0, used: 29.0, remaining: 0.0, color: '#228B22' },
  { id: '14', name: 'Matthias Herbst', allowance: 36.0, used: 23.0, remaining: 13.0, color: '#4B0082' },
  { id: '15', name: 'Max Sanktjohanser', allowance: 30.0, used: 23.0, remaining: 7.0, color: '#DC143C' },
  { id: '16', name: 'Michael Reiser', allowance: 20.0, used: 19.5, remaining: 0.5, color: '#00CED1' },
  { id: '17', name: 'Mihaela Abmayr', allowance: 27.0, used: 19.0, remaining: 8.0, color: '#FF6347' },
  { id: '18', name: 'Petra Gräf', allowance: 35.0, used: 21.0, remaining: 14.0, color: '#4682B4' },
  { id: '19', name: 'René Kühn', allowance: 32.5, used: 28.0, remaining: 4.5, color: '#D2691E' },
  { id: '20', name: 'Safat Majumder', allowance: 30.0, used: 7.0, remaining: 23.0, color: '#FF4500' },
  { id: '21', name: 'Sönke Rocho', allowance: 41.0, used: 31.0, remaining: 10.0, color: '#8B008B' },
  { id: '22', name: 'Thierry Brunner', allowance: 37.0, used: 28.0, remaining: 9.0, color: '#556B2F' }
];

// =====================================================
// HYBRID EMPLOYEE OPERATIONS
// =====================================================

export const getEmployees = async () => {
  const connected = await testConnection();

  if (connected && !useLocalStorage) {
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;

      const employees = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        allowance: emp.allowance_days,
        used: emp.used_days,
        remaining: emp.remaining_days,
        color: emp.color_code
      }));

      console.log(`✅ Loaded ${employees.length} employees from database`);
      return employees;
    } catch (error) {
      console.error('Database query failed, falling back to localStorage:', error);
      useLocalStorage = true;
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (stored) {
      try {
        const employees = JSON.parse(stored);
        console.log(`📱 Loaded ${employees.length} employees from localStorage`);
        return employees;
      } catch (error) {
        console.error('Failed to parse localStorage employees:', error);
      }
    }
  }

  // Final fallback to defaults
  const defaults = getDefaultEmployees();
  console.log('🔄 Using default employees');
  return defaults;
};

export const saveEmployees = async (employees) => {
  let saved = false;

  const connected = await testConnection();

  if (connected && !useLocalStorage) {
    // Try Supabase first
    try {
      // Clear existing and insert new
      await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      for (const emp of employees) {
        await supabase
          .from('employees')
          .insert({
            name: emp.name,
            allowance_days: emp.allowance,
            used_days: emp.used,
            remaining_days: emp.remaining,
            color_code: emp.color
          });
      }

      console.log('✅ Employees saved to database');
      saved = true;
    } catch (error) {
      console.error('Database save failed, falling back to localStorage:', error);
      useLocalStorage = true;
    }
  }

  // Also save to localStorage as backup
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      console.log('📱 Employees saved to localStorage');
      saved = true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  return saved;
};

// =====================================================
// HYBRID VACATION OPERATIONS
// =====================================================

export const getVacations = async () => {
  const connected = await testConnection();

  if (connected && !useLocalStorage) {
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select(`
          *,
          employees (
            name,
            color_code
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;

      console.log(`✅ Loaded ${data.length} vacations from database`);
      return data;
    } catch (error) {
      console.error('Database vacation query failed, falling back to localStorage:', error);
      useLocalStorage = true;
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.VACATIONS);
    if (stored) {
      try {
        const vacations = JSON.parse(stored);
        console.log(`📱 Loaded ${vacations.length} vacations from localStorage`);
        return vacations;
      } catch (error) {
        console.error('Failed to parse localStorage vacations:', error);
      }
    }
  }

  return [];
};

export const addVacation = async (vacationData) => {
  const connected = await testConnection();

  if (connected && !useLocalStorage) {
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('vacations')
        .insert({
          employee_id: vacationData.employee_id,
          start_date: vacationData.startDate,
          end_date: vacationData.endDate,
          days_count: parseFloat(vacationData.days),
          reason: vacationData.reason || 'Urlaub (ganzer Tag)'
        })
        .select()
        .single();

      if (error) throw error;

      // Update employee used/remaining days
      await updateEmployeeVacationTotals(vacationData.employee_id);

      console.log('✅ Vacation saved to database');
      return { success: true, vacation: data };
    } catch (error) {
      console.error('Database vacation save failed, falling back to localStorage:', error);
      useLocalStorage = true;
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const vacations = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACATIONS) || '[]');
      const newVacation = {
        id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employee_id: vacationData.employee_id,
        start_date: vacationData.startDate,
        end_date: vacationData.endDate,
        days_count: parseFloat(vacationData.days),
        reason: vacationData.reason || 'Urlaub (ganzer Tag)',
        created_at: new Date().toISOString()
      };

      vacations.push(newVacation);
      localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

      // Update employee data in localStorage
      await updateEmployeeLocalStorage(vacationData.employee_id, parseFloat(vacationData.days));

      console.log('📱 Vacation saved to localStorage');
      return { success: true, vacation: newVacation };
    } catch (error) {
      console.error('Failed to save vacation to localStorage:', error);
      return { success: false };
    }
  }

  return { success: false };
};

export const deleteVacation = async (vacationId) => {
  const connected = await testConnection();

  if (connected && !useLocalStorage) {
    // Try Supabase first
    try {
      // Get vacation details before deleting
      const { data: vacation, error: getError } = await supabase
        .from('vacations')
        .select('employee_id, days_count')
        .eq('id', vacationId)
        .single();

      if (getError) throw getError;

      // Delete vacation
      const { error: deleteError } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacationId);

      if (deleteError) throw deleteError;

      // Update employee totals
      await updateEmployeeVacationTotals(vacation.employee_id);

      console.log('✅ Vacation deleted from database');
      return true;
    } catch (error) {
      console.error('Database vacation delete failed, falling back to localStorage:', error);
      useLocalStorage = true;
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const vacations = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACATIONS) || '[]');
      const vacationIndex = vacations.findIndex(v => v.id === vacationId);

      if (vacationIndex === -1) {
        throw new Error('Vacation not found in localStorage');
      }

      const vacation = vacations[vacationIndex];
      vacations.splice(vacationIndex, 1);
      localStorage.setItem(STORAGE_KEYS.VACATIONS, JSON.stringify(vacations));

      // Update employee data
      await updateEmployeeLocalStorage(vacation.employee_id, -vacation.days_count);

      console.log('📱 Vacation deleted from localStorage');
      return true;
    } catch (error) {
      console.error('Failed to delete vacation from localStorage:', error);
      return false;
    }
  }

  return false;
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const updateEmployeeVacationTotals = async (employeeId) => {
  try {
    // Get all vacations for this employee
    const { data: vacations, error: vacError } = await supabase
      .from('vacations')
      .select('days_count')
      .eq('employee_id', employeeId);

    if (vacError) throw vacError;

    const totalUsed = vacations.reduce((sum, v) => sum + v.days_count, 0);

    // Get employee's allowance
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('allowance_days')
      .eq('id', employeeId)
      .single();

    if (empError) throw empError;

    // Update employee
    await supabase
      .from('employees')
      .update({
        used_days: totalUsed,
        remaining_days: employee.allowance_days - totalUsed
      })
      .eq('id', employeeId);

  } catch (error) {
    console.error('Failed to update employee totals:', error);
  }
};

const updateEmployeeLocalStorage = async (employeeId, daysDelta) => {
  try {
    const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

    if (employeeIndex !== -1) {
      employees[employeeIndex].used += daysDelta;
      employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used;
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    }
  } catch (error) {
    console.error('Failed to update employee in localStorage:', error);
  }
};

// =====================================================
// CONNECTION STATUS
// =====================================================

export const getConnectionStatus = async () => {
  const connected = await testConnection();

  if (connected && !useLocalStorage) {
    return {
      status: 'database',
      message: '✅ Database connected - multi-user sharing enabled',
      icon: '🌐'
    };
  } else {
    return {
      status: 'localStorage',
      message: '⚠️ Using local storage - changes won\'t sync across devices',
      icon: '📱'
    };
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  initializeSupabase();
}