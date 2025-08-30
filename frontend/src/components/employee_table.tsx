import React, { useState } from 'react';
import Gravatar from './Gravatar';

const EmployeeTable = ({ employees, onEditEmployee, onDeleteEmployee }) => {
  const [sortField, setSortField] = useState('employeeNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filter, setFilter] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredEmployees = sortedEmployees.filter(emp => 
    Object.values(emp).some(val => 
      String(val).toLowerCase().includes(filter.toLowerCase())
    )
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="employee-table">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Filter employees..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('employeeNumber')}>
                ID {sortField === 'employeeNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Avatar</th>
              <th onClick={() => handleSort('name')}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('position')}>
                Position {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('salary')}>
                Salary {sortField === 'salary' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('birthDate')}>
                Birth Date {sortField === 'birthDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(employee => (
              <tr key={employee._id || employee.id}>
                <td>{employee.employeeNumber}</td>
                <td>
                  <Gravatar email={employee.email} size={30} />
                </td>
                <td>{employee.name} {employee.surname}</td>
                <td>{employee.position}</td>
                <td>${employee.salary.toLocaleString()}</td>
                <td>{formatDate(employee.birthDate)}</td>
                <td>
                  {employee.managerId ? 
                    employees.find(m => m._id === employee.managerId)?.name || 'Loading...' : 
                    'CEO (No Manager)'}
                </td>
                <td>
                  <button 
                    onClick={() => onEditEmployee(employee)}
                    className="btn-edit"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDeleteEmployee(employee._id || employee.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredEmployees.length === 0 && (
        <div className="no-results">
          No employees found matching your filter.
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;