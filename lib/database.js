// REAL SUPABASE DATABASE IMPLEMENTATION
// This replaces ALL localStorage with actual database operations

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables missing!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('employees').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// =====================================================
// EMPLOYEE OPERATIONS - REAL DATABASE
// =====================================================

export const getEmployees = async () => {
  try {
    console.log('🔄 Loading employees from Supabase database...');

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error loading employees:', error);
      return getDefaultEmployees(); // Fallback to defaults
    }

    // Convert database format to app format
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
    console.error('❌ Database error:', error);
    return getDefaultEmployees(); // Fallback to defaults
  }
};

export const saveEmployee = async (employee) => {
  try {
    console.log('🔄 Saving employee to database:', employee.name);

    const { data, error } = await supabase
      .from('employees')
      .upsert({
        id: employee.id,
        name: employee.name,
        allowance_days: employee.allowance,
        used_days: employee.used,
        remaining_days: employee.remaining,
        color_code: employee.color
      })
      .select();

    if (error) throw error;

    console.log('✅ Employee saved to database');
    return data;
  } catch (error) {
    console.error('❌ Failed to save employee:', error);
    throw error;
  }
};

// =====================================================
// VACATION OPERATIONS - REAL DATABASE
// =====================================================

export const getVacations = async () => {
  try {
    console.log('🔄 Loading vacations from Supabase database...');

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

    if (error) {
      console.error('❌ Error loading vacations:', error);
      return [];
    }

    console.log(`✅ Loaded ${data.length} vacations from database`);
    return data;
  } catch (error) {
    console.error('❌ Database error:', error);
    return [];
  }
};

export const addVacationToDb = async (employeeId, vacationData) => {
  try {
    console.log('🔄 Adding vacation to database for employee:', employeeId);
    console.log('Vacation data:', vacationData);

    // Step 1: Insert vacation into database
    const { data: vacation, error: vacError } = await supabase
      .from('vacations')
      .insert({
        employee_id: employeeId,
        start_date: vacationData.startDate,
        end_date: vacationData.endDate,
        days_count: parseFloat(vacationData.days),
        reason: vacationData.reason || 'Urlaub (ganzer Tag)'
      })
      .select()
      .single();

    if (vacError) {
      console.error('❌ Failed to insert vacation:', vacError);
      throw vacError;
    }

    console.log('✅ Vacation inserted into database');

    // Step 2: Recalculate employee used days from all vacations
    const { data: allVacations, error: vacListError } = await supabase
      .from('vacations')
      .select('days_count')
      .eq('employee_id', employeeId);

    if (vacListError) {
      console.error('❌ Failed to get employee vacations:', vacListError);
      throw vacListError;
    }

    // Calculate total used days
    const totalUsed = allVacations.reduce((sum, v) => sum + v.days_count, 0);

    // Step 3: Update employee used/remaining days
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .update({
        used_days: totalUsed
      })
      .eq('id', employeeId)
      .select('allowance_days')
      .single();

    if (empError) {
      console.error('❌ Failed to update employee:', empError);
      throw empError;
    }

    // Update remaining days
    const remaining = employee.allowance_days - totalUsed;
    await supabase
      .from('employees')
      .update({ remaining_days: remaining })
      .eq('id', employeeId);

    console.log('✅ Employee vacation totals updated');
    console.log(`Total used: ${totalUsed}, Remaining: ${remaining}`);

    return vacation;
  } catch (error) {
    console.error('❌ Failed to add vacation:', error);
    throw error;
  }
};

export const deleteVacationFromDb = async (vacationId) => {
  try {
    console.log('🔄 Deleting vacation from database:', vacationId);

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

    // Recalculate employee totals
    const { data: remainingVacations } = await supabase
      .from('vacations')
      .select('days_count')
      .eq('employee_id', vacation.employee_id);

    const totalUsed = remainingVacations.reduce((sum, v) => sum + v.days_count, 0);

    // Update employee
    const { data: employee } = await supabase
      .from('employees')
      .select('allowance_days')
      .eq('id', vacation.employee_id)
      .single();

    await supabase
      .from('employees')
      .update({
        used_days: totalUsed,
        remaining_days: employee.allowance_days - totalUsed
      })
      .eq('id', vacation.employee_id);

    console.log('✅ Vacation deleted and employee updated');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete vacation:', error);
    throw error;
  }
};

// =====================================================
// INITIALIZATION - SETUP DEFAULT DATA
// =====================================================

export const getDefaultEmployees = () => [
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
  { id: '20', name: 'Sönke Rocho', allowance: 41.0, used: 31.0, remaining: 10.0, color: '#8B008B' },
  { id: '21', name: 'Thierry Brunner', allowance: 37.0, used: 28.0, remaining: 9.0, color: '#556B2F' },
  { id: '22', name: 'Safat Majumder', allowance: 30.0, used: 7.0, remaining: 23.0, color: '#FF4500' }
];

export const initializeEmployeesInDatabase = async () => {
  try {
    console.log('🔄 Checking if employees exist in database...');

    const { data: existingEmployees, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    if (error) throw error;

    if (existingEmployees.length === 0) {
      console.log('🔄 No employees found, initializing default employees...');

      const defaultEmployees = getDefaultEmployees();

      for (const emp of defaultEmployees) {
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

      console.log('✅ Default employees initialized in database');
    } else {
      console.log('✅ Employees already exist in database');
    }
  } catch (error) {
    console.error('❌ Failed to initialize employees:', error);
  }
};

// Initialize connection test on import
if (typeof window !== 'undefined') {
  testConnection();
}