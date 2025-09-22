// SHARED FILE-BASED STORAGE - Real multi-user data persistence
// Replaces broken localStorage/Supabase hybrid with working solution

// =====================================================
// EMPLOYEE OPERATIONS
// =====================================================

export const getEmployees = async () => {
  try {
    console.log('🔍 Fetching employees from shared storage...');
    const response = await fetch('/api/employees');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle the API response format { ok: true, data: [...] }
    const employees = result.data || result;
    console.log(`✅ Loaded ${employees.length} employees from SHARED STORAGE`);

    // Convert to expected format for compatibility
    return employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      allowance: emp.allowance || emp.allowance_days,
      used: emp.used || emp.used_vacation_days,
      remaining: emp.remaining || emp.remaining_vacation,
      color: emp.color
    }));
  } catch (error) {
    console.error('❌ Failed to fetch employees:', error);
    throw error;
  }
};

export const saveEmployees = async (employees) => {
  try {
    console.log('💾 Saving employees to shared storage...');
    const response = await fetch('/api/employees', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employees)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Employees saved to shared storage');
    return result;
  } catch (error) {
    console.error('❌ Failed to save employees:', error);
    throw error;
  }
};

export const addEmployee = async (employeeData) => {
  try {
    console.log('➕ Adding new employee to shared storage...');
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Added employee: ${result.employee.name}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to add employee:', error);
    throw error;
  }
};

// =====================================================
// VACATION OPERATIONS
// =====================================================

export const getVacations = async () => {
  try {
    console.log('🔍 Fetching vacations from shared storage...');
    const response = await fetch('/api/vacations');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vacations = await response.json();
    console.log(`✅ Loaded ${vacations.length} vacations from shared storage`);
    return vacations;
  } catch (error) {
    console.error('❌ Failed to fetch vacations:', error);
    throw error;
  }
};

export const addVacation = async (vacationData) => {
  try {
    console.log('➕ Adding vacation to shared storage...');
    const response = await fetch('/api/vacations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vacationData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Added vacation: ${result.vacation.days} days for employee ${result.vacation.employee_id}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to add vacation:', error);
    throw error;
  }
};

export const deleteVacation = async (vacationId) => {
  try {
    console.log(`🗑️ Deleting vacation from shared storage: ${vacationId}`);
    const response = await fetch('/api/vacations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vacationId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Deleted vacation: ${vacationId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to delete vacation:', error);
    throw error;
  }
};

// =====================================================
// CONNECTION STATUS
// =====================================================

export const getConnectionStatus = async () => {
  try {
    // Test if API is working
    await fetch('/api/employees');
    return {
      status: 'shared',
      message: '✅ Shared storage active - multi-user sync enabled',
      icon: '🌐'
    };
  } catch (error) {
    return {
      status: 'error',
      message: '❌ Shared storage unavailable - check server',
      icon: '⚠️'
    };
  }
};

// =====================================================
// REAL-TIME REFRESH HELPER
// =====================================================

export const refreshAllData = async () => {
  try {
    console.log('🔄 Refreshing all data from shared storage...');
    const [employees, vacations] = await Promise.all([
      getEmployees(),
      getVacations()
    ]);

    console.log(`🔄 Refreshed: ${employees.length} employees, ${vacations.length} vacations`);
    return { employees, vacations };
  } catch (error) {
    console.error('❌ Failed to refresh data:', error);
    throw error;
  }
};