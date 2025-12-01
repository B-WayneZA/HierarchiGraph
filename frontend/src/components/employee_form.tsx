import React, { useState, useEffect, ChangeEvent, FC } from 'react';

type Employee = {
  employeeNumber?: string;
  name?: string;
  surname?: string;
  birthDate?: string;
  salary?: string;
  position?: string;
  email?: string;
  managerId?: string;
};

type EmployeeFormProps = {
  employee?: Employee;
  employees: Employee[];
  onSubmit: (employee: Employee) => void;
  onCancel: () => void;
};

const EmployeeForm: FC<EmployeeFormProps> = ({ employee, employees, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Employee>({
    employeeNumber: '',
    name: '',
    surname: '',
    birthDate: '',
    salary: '',
    position: '',
    email: '',
    managerId: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeNumber: employee.employeeNumber || '',
        name: employee.name || '',
        surname: employee.surname || '',
        birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : '',
        salary: employee.salary || '',
        position: employee.position || '',
        email: employee.email || '',
        managerId: employee.managerId || ''
      });
    } else {
      setFormData({
        employeeNumber: '',
        name: '',
        surname: '',
        birthDate: '',
        salary: '',
        position: '',
        email: '',
        managerId: ''
      });
    }
  }, [employee]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.employeeNumber) newErrors.employeeNumber = 'Employee number is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.surname) newErrors.surname = 'Surname is required';
    if (!formData.birthDate) newErrors.birthDate = 'Birth date is required';
    if (!formData.salary || parseFloat(formData.salary) <= 0) newErrors.salary = 'Valid salary is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      if (!employee) {
        // Reset form after creating new employee
        setFormData({
          employeeNumber: '',
          name: '',
          surname: '',
          birthDate: '',
          salary: '',
          position: '',
          email: '',
          managerId: ''
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="employee-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="employeeNumber">Employee Number *</label>
          <input
            type="text"
            id="employeeNumber"
            name="employeeNumber"
            value={formData.employeeNumber}
            onChange={handleChange}
            className={errors.employeeNumber ? 'error' : ''}
          />
          {errors.employeeNumber && <span className="error-text">{errors.employeeNumber}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="position">Position *</label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className={errors.position ? 'error' : ''}
          />
          {errors.position && <span className="error-text">{errors.position}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="surname">Surname *</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            className={errors.surname ? 'error' : ''}
          />
          {errors.surname && <span className="error-text">{errors.surname}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="salary">Salary ($) *</label>
          <input
            type="number"
            id="salary"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            min="0"
            step="1000"
            className={errors.salary ? 'error' : ''}
          />
          {errors.salary && <span className="error-text">{errors.salary}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="birthDate">Birth Date *</label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className={errors.birthDate ? 'error' : ''}
          />
          {errors.birthDate && <span className="error-text">{errors.birthDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="managerId">Manager</label>
          <select
            id="managerId"
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
          >
            <option value="">No Manager (CEO)</option>
            {employees
              .filter(emp => !employee || emp.employeeNumber !== employee.employeeNumber)
              .map(emp => (
                <option key={emp.employeeNumber || emp.employeeNumber} value={emp.employeeNumber || emp.employeeNumber}>
                  {emp.name} {emp.surname} - {emp.position}
                </option>
              ))}
            </select>
        </div>
      </div>
    </form>
  );
};

export default EmployeeForm;