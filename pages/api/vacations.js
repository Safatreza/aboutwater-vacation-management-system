import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const vacationsFile = path.join(dataDir, 'vacations.json');
const employeesFile = path.join(dataDir, 'employees.json');

export default function handler(req, res) {
  console.log(`📨 API /vacations ${req.method} request received`);

  try {
    if (req.method === 'GET') {
      // Read vacations from file
      const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'));
      console.log(`📖 Loaded ${vacations.length} vacations from file`);
      res.status(200).json(vacations);
    }
    else if (req.method === 'POST') {
      // Add new vacation
      const newVacation = {
        id: `vac_${Date.now()}`,
        employee_id: req.body.employee_id,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        days: parseFloat(req.body.days),
        reason: req.body.reason || 'Urlaub',
        created_at: new Date().toISOString()
      };

      // Add to vacations file
      const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'));
      vacations.push(newVacation);
      fs.writeFileSync(vacationsFile, JSON.stringify(vacations, null, 2));
      console.log(`➕ Added vacation: ${newVacation.days} days for employee ${newVacation.employee_id}`);

      // Update employee used/remaining days
      const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));
      const employeeIndex = employees.findIndex(emp => emp.id === newVacation.employee_id);

      if (employeeIndex !== -1) {
        const oldUsed = employees[employeeIndex].used;
        employees[employeeIndex].used = parseFloat(employees[employeeIndex].used) + parseFloat(newVacation.days);
        employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used;

        fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2));
        console.log(`📊 Updated employee ${employees[employeeIndex].name}: used ${oldUsed} → ${employees[employeeIndex].used}, remaining: ${employees[employeeIndex].remaining}`);
      }

      res.status(200).json({
        success: true,
        vacation: newVacation,
        employees: employees
      });
    }
    else if (req.method === 'DELETE') {
      // Delete vacation by ID
      const { id } = req.body;
      const vacations = JSON.parse(fs.readFileSync(vacationsFile, 'utf8'));
      const vacationIndex = vacations.findIndex(vac => vac.id === id);

      if (vacationIndex === -1) {
        return res.status(404).json({ error: 'Vacation not found' });
      }

      const deletedVacation = vacations[vacationIndex];
      vacations.splice(vacationIndex, 1);
      fs.writeFileSync(vacationsFile, JSON.stringify(vacations, null, 2));

      // Update employee used/remaining days
      const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));
      const employeeIndex = employees.findIndex(emp => emp.id === deletedVacation.employee_id);

      if (employeeIndex !== -1) {
        const oldUsed = employees[employeeIndex].used;
        employees[employeeIndex].used = parseFloat(employees[employeeIndex].used) - parseFloat(deletedVacation.days);
        employees[employeeIndex].remaining = employees[employeeIndex].allowance - employees[employeeIndex].used;

        fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2));
        console.log(`📊 Reverted employee ${employees[employeeIndex].name}: used ${oldUsed} → ${employees[employeeIndex].used}, remaining: ${employees[employeeIndex].remaining}`);
      }

      console.log(`🗑️ Deleted vacation: ${deletedVacation.id}`);
      res.status(200).json({
        success: true,
        deletedVacation,
        employees: employees
      });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ API /vacations error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}