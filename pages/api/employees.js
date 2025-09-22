import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const employeesFile = path.join(dataDir, 'employees.json');
const vacationsFile = path.join(dataDir, 'vacations.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default employee data
const defaultEmployees = [
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

// Initialize files if they don't exist
if (!fs.existsSync(employeesFile)) {
  fs.writeFileSync(employeesFile, JSON.stringify(defaultEmployees, null, 2));
  console.log('✅ Initialized employees.json with default data');
}

if (!fs.existsSync(vacationsFile)) {
  fs.writeFileSync(vacationsFile, JSON.stringify([], null, 2));
  console.log('✅ Initialized vacations.json');
}

export default function handler(req, res) {
  console.log(`📨 API /employees ${req.method} request received`);

  try {
    if (req.method === 'GET') {
      // Read employees from file
      const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));
      console.log(`📖 Loaded ${employees.length} employees from file`);
      res.status(200).json(employees);
    }
    else if (req.method === 'PUT') {
      // Save employees to file
      fs.writeFileSync(employeesFile, JSON.stringify(req.body, null, 2));
      console.log(`💾 Saved ${req.body.length} employees to file`);
      res.status(200).json({ success: true });
    }
    else if (req.method === 'POST') {
      // Add new employee
      const employees = JSON.parse(fs.readFileSync(employeesFile, 'utf8'));
      const newEmployee = {
        id: `emp_${Date.now()}`,
        ...req.body,
        used: 0,
        remaining: req.body.allowance || 0
      };
      employees.push(newEmployee);
      fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2));
      console.log(`➕ Added new employee: ${newEmployee.name}`);
      res.status(200).json({ success: true, employee: newEmployee });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ API /employees error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}