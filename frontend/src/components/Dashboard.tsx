import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Network, Building, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  avgSalary: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: 0,
    avgSalary: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /*
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/employees');
        const employees = response.data;
        
        const departments = new Set(employees.map((emp: any) => emp.department));
        const activeEmployees = employees.filter((emp: any) => emp.isActive);
        const avgSalary = employees.length > 0 
          ? employees.reduce((sum: number, emp: any) => sum + emp.salary, 0) / employees.length 
          : 0;

        setStats({
          totalEmployees: employees.length,
          activeEmployees: activeEmployees.length,
          departments: departments.size,
          avgSalary: Math.round(avgSalary)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    */

      const fetchStats = async () => {
        try {
          // Mock employees data
          const employees = [
            { id: 1, name: "Alice", department: "Engineering", isActive: true, salary: 75000 },
            { id: 2, name: "Bob", department: "HR", isActive: false, salary: 50000 },
            { id: 3, name: "Charlie", department: "Engineering", isActive: true, salary: 80000 },
            { id: 4, name: "Diana", department: "Finance", isActive: true, salary: 65000 },
          ];
    
          const departments = new Set(employees.map(emp => emp.department));
          const activeEmployees = employees.filter(emp => emp.isActive);
          const avgSalary = employees.length > 0
            ? employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length
            : 0;
    
          setStats({
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            departments: departments.size,
            avgSalary: Math.round(avgSalary),
          });
        } catch (error) {
          console.error("Error fetching stats:", error);
        } finally {
          setIsLoading(false);
        }
      };
    
      fetchStats();
    
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      href: '/employees'
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: Users,
      color: 'bg-green-500',
      href: '/employees'
    },
    {
      title: 'Departments',
      value: stats.departments,
      icon: Building,
      color: 'bg-purple-500',
      href: '/employees'
    },
    {
      title: 'Average Salary',
      value: `$${stats.avgSalary.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      href: '/employees'
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your employee hierarchy management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link
              key={index}
              to={stat.href}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/employees/new"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-gray-700">Add New Employee</span>
            </Link>
            <Link
              to="/hierarchy"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Network className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-gray-700">View Organization Chart</span>
            </Link>
            <Link
              to="/employees"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Building className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-gray-700">Manage Employees</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Application:</span>
              <span className="font-medium">HierarchiGraph</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Database:</span>
              <span className="font-medium">MongoDB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Authentication:</span>
              <span className="font-medium">JWT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
