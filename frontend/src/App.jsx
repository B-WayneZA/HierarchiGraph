import React, { useState, useEffect } from 'react';
import EmployeeHierarchy3D from './components/EmployeeHierarchy3D';
import EmployeeTable from './components/EmployeeTable';
import EmployeeForm from './components/EmployeeForm';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from './services/api';
import { generateGravatarUrl } from './utils/gravatar';
import './styles/App.css';

function App() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [view, setView] = useState('hierarchy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      const employeesWithGravatar = data.map(emp => ({
        ...emp,
        gravatarUrl: generateGravatarUrl(emp.email)
      }));
      setEmployees(employeesWithGravatar);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees. Please check your connection.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (employeeData) => {
    try {
      await createEmployee(employeeData);
      await fetchEmployees();
    } catch (err) {
      setError('Failed to create employee.');
      console.error('Error creating employee:', err);
    }
  };

  const handleUpdateEmployee = async (id, employeeData) => {
    try {
      await updateEmployee(id, employeeData);
      await fetchEmployees();
      setSelectedEmployee(null);
    } catch (err) {
      setError('Failed to update employee.');
      console.error('Error updating employee:', err);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    
    try {
      await deleteEmployee(id);
      await fetchEmployees();
    } catch (err) {
      setError('Failed to delete employee.');
      console.error('Error deleting employee:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading employee data...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>OrgVision 3D - Employee Hierarchy Manager</h1>
        <nav>
          <button 
            onClick={() => setView('hierarchy')}
            className={view === 'hierarchy' ? 'active' : ''}
          >
            3D Hierarchy
          </button>
          <button 
            onClick={() => setView('table')}
            className={view === 'table' ? 'active' : ''}
          >
            Employee Table
          </button>
        </nav>
      </header>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <main className="app-main">
        {view === 'hierarchy' && (
          <div className="hierarchy-view">
            <EmployeeHierarchy3D 
              employees={employees} 
              onEmployeeSelect={setSelectedEmployee}
            />
          </div>
        )}

        {view === 'table' && (
          <div className="table-view">
            <EmployeeTable 
              employees={employees}
              onEditEmployee={setSelectedEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          </div>
        )}

        <div className="form-section">
          <h2>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
          <EmployeeForm 
            employee={selectedEmployee}
            employees={employees}
            onSubmit={selectedEmployee ? 
              (data) => handleUpdateEmployee(selectedEmployee.id, data) : 
              handleCreateEmployee
            }
            onCancel={() => setSelectedEmployee(null)}
          />
        </div>
      </main>
    </div>
  );
}

export default App;