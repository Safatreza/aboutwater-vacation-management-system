// CENTRALIZED API LAYER - Single source of truth for all API calls
// This ensures consistent API calling across all components

export interface Employee {
  id: string;
  name: string;
  allowance_days: number;
  used_vacation_days: number;
  remaining_vacation: number;
  region_code?: string;
  active: boolean;
  color?: string;
}

export interface Vacation {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  working_days: number;
  note?: string;
  created_at?: string;
}

export interface AddVacationData {
  employee_id: string;
  start_date: string;
  end_date: string;
  working_days: number;
  note?: string;
}

// =====================================================
// EMPLOYEE OPERATIONS
// =====================================================

export async function fetchEmployees(): Promise<Employee[]> {
  console.log('🔍 API: Fetching employees...');

  const response = await fetch('/api/employees');

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API: Failed to fetch employees:', error);
    throw new Error(`Failed to fetch employees: ${error}`);
  }

  const employees = await response.json();
  console.log(`✅ API: Loaded ${employees.length} employees`);

  return employees;
}

export async function addEmployee(employeeData: any) {
  console.log('➕ API: Adding employee...', employeeData.name);

  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API: Failed to add employee:', error);
    throw new Error(`Failed to add employee: ${error}`);
  }

  const result = await response.json();
  console.log(`✅ API: Added employee: ${result.employee.name}`);

  return result;
}

export async function updateEmployees(employees: Employee[]) {
  console.log('💾 API: Updating employees...', employees.length);

  const response = await fetch('/api/employees', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employees)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API: Failed to update employees:', error);
    throw new Error(`Failed to update employees: ${error}`);
  }

  const result = await response.json();
  console.log('✅ API: Updated employees successfully');

  return result;
}

// =====================================================
// VACATION OPERATIONS
// =====================================================

export async function fetchVacations(): Promise<Vacation[]> {
  console.log('🔍 API: Fetching vacations...');

  const response = await fetch('/api/vacations');

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API: Failed to fetch vacations:', error);
    throw new Error(`Failed to fetch vacations: ${error}`);
  }

  const vacations = await response.json();
  console.log(`✅ API: Loaded ${vacations.length} vacations`);

  return vacations;
}

export async function addVacation(vacationData: AddVacationData): Promise<{success: boolean, vacation: Vacation, employees: Employee[]}> {
  console.log('➕ API: Adding vacation...', vacationData);

  const response = await fetch('/api/vacations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vacationData)
  });

  console.log('📡 API: Vacation response status:', response.status);

  // Get response text first for debugging
  const responseText = await response.text();
  console.log('📡 API: Vacation response text:', responseText);

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch (parseError) {
      errorData = {
        error: 'Server returned invalid JSON',
        status: response.status,
        statusText: response.statusText,
        responseText: responseText
      };
    }

    console.error('❌ API: Vacation server error:', errorData);
    throw new Error(`Vacation creation failed: ${JSON.stringify(errorData, null, 2)}`);
  }

  // Parse successful response
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError) {
    console.error('❌ API: Failed to parse vacation success response:', parseError);
    throw new Error(`Failed to parse server response: ${responseText}`);
  }

  console.log(`✅ API: Vacation added successfully - ${result.vacation.working_days} days for employee ${result.vacation.employee_id}`);

  return result;
}

export async function deleteVacation(vacationId: string): Promise<{success: boolean, deletedVacation: Vacation, employees: Employee[]}> {
  console.log('🗑️ API: Deleting vacation...', vacationId);

  const response = await fetch('/api/vacations', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: vacationId })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API: Failed to delete vacation:', error);
    throw new Error(`Failed to delete vacation: ${error}`);
  }

  const result = await response.json();
  console.log(`✅ API: Vacation deleted: ${vacationId}`);

  return result;
}

// =====================================================
// HOLIDAY OPERATIONS
// =====================================================

export async function fetchHolidays() {
  console.log('🔍 API: Fetching holidays...');

  const response = await fetch('/api/holidays');

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API: Failed to fetch holidays:', error);
    throw new Error(`Failed to fetch holidays: ${error}`);
  }

  const holidays = await response.json();
  console.log(`✅ API: Loaded ${holidays.total} holidays (${holidays.public_holidays_count} public, ${holidays.school_holidays_count} school)`);

  return holidays;
}

// =====================================================
// COMBINED DATA FETCHING
// =====================================================

export async function fetchAllData(): Promise<{employees: Employee[], vacations: Vacation[]}> {
  console.log('🔄 API: Fetching all data...');

  try {
    const [employees, vacations] = await Promise.all([
      fetchEmployees(),
      fetchVacations()
    ]);

    console.log(`🔄 API: All data fetched - ${employees.length} employees, ${vacations.length} vacations`);

    return { employees, vacations };
  } catch (error) {
    console.error('❌ API: Failed to fetch all data:', error);
    throw error;
  }
}