import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
  managerId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  gravatarUrl: string;
}

const MOCK_EMPLOYEES: Employee[] = [
  {
    _id: "ceo1",
    employeeId: "E001",
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@company.com",
    position: "CEO",
    department: "Executive",
    salary: 250000,
    hireDate: "2015-01-10",
    isActive: true,
    gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000001",
  },
  {
    _id: "mgr1",
    employeeId: "E002",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@company.com",
    position: "Head of Engineering",
    department: "Engineering",
    salary: 150000,
    hireDate: "2017-03-15",
    isActive: true,
    managerId: { _id: "ceo1", firstName: "Alice", lastName: "Johnson" },
    gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000002",
  },
  {
    _id: "dev1",
    employeeId: "E003",
    firstName: "Charlie",
    lastName: "Brown",
    email: "charlie@company.com",
    position: "Software Engineer",
    department: "Engineering",
    salary: 90000,
    hireDate: "2021-06-20",
    isActive: true,
    managerId: { _id: "mgr1", firstName: "Bob", lastName: "Smith" },
    gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000003",
  },
  {
    _id: "dev2",
    employeeId: "E004",
    firstName: "Diana",
    lastName: "Taylor",
    email: "diana@company.com",
    position: "Software Engineer",
    department: "Engineering",
    salary: 95000,
    hireDate: "2020-11-05",
    isActive: false,
    managerId: { _id: "mgr1", firstName: "Bob", lastName: "Smith" },
    gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000004",
  },
  {
    _id: "hr1",
    employeeId: "E005",
    firstName: "Fiona",
    lastName: "Adams",
    email: "fiona@company.com",
    position: "HR Consultant",
    department: "Human Resources",
    salary: 75000,
    hireDate: "2019-08-10",
    isActive: true,
    managerId: { _id: "ceo1", firstName: "Alice", lastName: "Johnson" },
    gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000006",
  },
];

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    // Mocked fetch
    setTimeout(() => {
      setEmployees(MOCK_EMPLOYEES);
      setIsLoading(false);
    }, 700);
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        [emp.firstName, emp.lastName, emp.email, emp.employeeId]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((emp) => emp.isActive);
    }

    if (statusFilter === "inactive") {
      filtered = filtered.filter((emp) => !emp.isActive);
    }

    setFilteredEmployees(filtered);
  };

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-2">Manage your organization's employee data</p>
        </div>
        <Link to="/employees/new" className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Department */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Count */}
          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3">Position</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Manager</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 flex items-center">
                    <img
                      src={emp.gravatarUrl}
                      className="h-10 w-10 rounded-full"
                      alt=""
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-gray-400">{emp.email}</div>
                      <div className="text-xs text-gray-400">ID: {emp.employeeId}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">{emp.position}</td>
                  <td className="px-6 py-4">{emp.department}</td>
                  <td className="px-6 py-4">
                    {emp.managerId ? (
                      <span>{emp.managerId.firstName} {emp.managerId.lastName}</span>
                    ) : (
                      <span className="text-gray-400">No manager</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        emp.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/employees/${emp._id}`} className="text-primary-600">
                        <Eye className="h-4 w-4" />
                      </Link>

                      <Link to={`/employees/${emp._id}/edit`} className="text-blue-600">
                        <Edit className="h-4 w-4" />
                      </Link>

                      <button className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No employees found
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeList;
