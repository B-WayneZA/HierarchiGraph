import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, User, Mail, Building, DollarSign, Calendar } from 'lucide-react';
import md5 from 'blueimp-md5';

interface EmployeeFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  managerId?: string;
}

interface Manager {
  _id: string;
  firstName: string;
  lastName: string;
  position: string;
}

const EmployeeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<EmployeeFormData>();

  const email = watch('email');

  useEffect(() => {
    fetchManagers();
    if (id) {
      setIsEditMode(true);
      fetchEmployee();
    }
  }, [id]);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('/api/employees');
      setManagers(response.data.filter((emp: any) => emp.isActive));
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await axios.get(`/api/employees/${id}`);
      const employee = response.data;
      reset({
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salary: employee.salary,
        hireDate: employee.hireDate.split('T')[0],
        managerId: employee.managerId?._id || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to fetch employee data');
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      if (isEditMode) {
        await axios.put(`/api/employees/${id}`, data);
        toast.success('Employee updated successfully');
      } else {
        await axios.post('/api/employees', data);
        toast.success('Employee created successfully');
      }
      navigate('/employees');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Operation failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateGravatarUrl = (email: string) => {
    if (!email) return '';
    const hash = md5(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Employee' : 'Add New Employee'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update employee information' : 'Create a new employee record'}
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          {email && (
            <div className="flex justify-center mb-6">
              <img
                src={generateGravatarUrl(email)}
                alt="Avatar preview"
                className="w-20 h-20 rounded-full border-2 border-gray-200"
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                  Employee ID *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="employeeId"
                    type="text"
                    {...register('employeeId', {
                      required: 'Employee ID is required',
                      minLength: {
                        value: 2,
                        message: 'Employee ID must be at least 2 characters'
                      }
                    })}
                    className="input-field pl-10"
                    placeholder="Enter employee ID"
                    disabled={isEditMode}
                  />
                </div>
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="input-field pl-10"
                    placeholder="Enter email address"
                  />
                </div>
                {errors?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors?.email?.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                    className="input-field pl-10"
                    placeholder="Enter first name"
                  />
                </div>
                {errors?.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors?.firstName?.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                    className="input-field pl-10"
                    placeholder="Enter last name"
                  />
                </div>
                {errors?.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors?.lastName?.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="position"
                    type="text"
                    {...register('position', {
                      required: 'Position is required'
                    })}
                    className="input-field pl-10"
                    placeholder="Enter position"
                  />
                </div>
                {errors?.position && (
                  <p className="mt-1 text-sm text-red-600">{errors?.position?.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="department"
                    type="text"
                    {...register('department', {
                      required: 'Department is required'
                    })}
                    className="input-field pl-10"
                    placeholder="Enter department"
                  />
                </div>
                {errors?.department && (
                  <p className="mt-1 text-sm text-red-600">{errors?.department?.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                  Salary *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="salary"
                    type="number"
                    step="0.01"
                    {...register('salary', {
                      required: 'Salary is required',
                      min: {
                        value: 0,
                        message: 'Salary must be positive'
                      }
                    })}
                    className="input-field pl-10"
                    placeholder="Enter salary"
                  />
                </div>
                {errors?.salary && (
                  <p className="mt-1 text-sm text-red-600">{errors?.salary?.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">
                  Hire Date *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="hireDate"
                    type="date"
                    {...register('hireDate', {
                      required: 'Hire date is required'
                    })}
                    className="input-field pl-10"
                  />
                </div>
                {errors?.hireDate && (
                  <p className="mt-1 text-sm text-red-600">{errors?.hireDate?.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
                Manager
              </label>
              <div className="mt-1">  
                <select
                  id="managerId"
                  {...register('managerId')}
                  className="input-field"
                >
                  <option value="">No manager</option>
                  {managers.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.firstName} {manager.lastName} - {manager.position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEditMode ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
