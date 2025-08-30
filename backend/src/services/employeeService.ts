import { Employee, IEmployee } from '../models/Employee';
import mongoose from 'mongoose';

export interface CreateEmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  hireDate: Date;
  managerId?: string;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  department?: string;
  salary?: number;
  hireDate?: Date;
  managerId?: string;
  isActive?: boolean;
}

export interface EmployeeFilters {
  department?: string;
  isActive?: boolean;
  managerId?: string;
}

export class EmployeeService {
  static async getAllEmployees(filters: EmployeeFilters = {}) {
    const query: any = {};

    if (filters.department) query.department = filters.department;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.managerId) query.managerId = filters.managerId;

    const employees = await Employee.find(query)
      .populate('managerId', 'firstName lastName email position')
      .populate('subordinates', 'firstName lastName email position')
      .sort({ firstName: 1, lastName: 1 });

    return employees.map(emp => ({
      ...emp.toObject(),
      gravatarUrl: emp.getGravatarUrl()
    }));
  }

  static async getEmployeeById(id: string) {
    const employee = await Employee.findById(id)
      .populate('managerId', 'firstName lastName email position')
      .populate('subordinates', 'firstName lastName email position');

    if (!employee) {
      throw new Error('Employee not found');
    }

    return {
      ...employee.toObject(),
      gravatarUrl: employee.getGravatarUrl()
    };
  }

  static async createEmployee(data: CreateEmployeeData) {
    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId: data.employeeId });
    if (existingEmployee) {
      throw new Error('Employee ID already exists');
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({ email: data.email });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Create new employee
    const employee = new Employee({
      ...data,
      managerId: data.managerId || null
    });

    await employee.save();

    // Update manager's subordinates if managerId is provided
    if (data.managerId) {
      await Employee.findByIdAndUpdate(
        data.managerId,
        { $push: { subordinates: employee._id } }
      );
    }

    const savedEmployee = await Employee.findById(employee._id)
      .populate('managerId', 'firstName lastName email position');

    return {
      ...savedEmployee!.toObject(),
      gravatarUrl: savedEmployee!.getGravatarUrl()
    };
  }

  static async updateEmployee(id: string, data: UpdateEmployeeData) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const oldManagerId = employee.managerId;

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    ).populate('managerId', 'firstName lastName email position');

    // Handle manager change
    if (data.managerId !== oldManagerId) {
      // Remove from old manager's subordinates
      if (oldManagerId) {
        await Employee.findByIdAndUpdate(
          oldManagerId,
          { $pull: { subordinates: employee._id } }
        );
      }

      // Add to new manager's subordinates
      if (data.managerId) {
        await Employee.findByIdAndUpdate(
          data.managerId,
          { $push: { subordinates: employee._id } }
        );
      }
    }

    return {
      ...updatedEmployee!.toObject(),
      gravatarUrl: updatedEmployee!.getGravatarUrl()
    };
  }

  static async deleteEmployee(id: string) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Remove from manager's subordinates
    if (employee.managerId) {
      await Employee.findByIdAndUpdate(
        employee.managerId,
        { $pull: { subordinates: employee._id } }
      );
    }

    // Reassign subordinates to the employee's manager
    if (employee.subordinates.length > 0) {
      await Employee.updateMany(
        { _id: { $in: employee.subordinates } },
        { managerId: employee.managerId }
      );
    }

    await Employee.findByIdAndDelete(id);
    return { message: 'Employee deleted successfully' };
  }

  static async getHierarchyTree() {
    const employees = await Employee.find({ isActive: true })
      .populate('managerId', 'firstName lastName email position')
      .populate('subordinates', 'firstName lastName email position')
      .sort({ firstName: 1, lastName: 1 });

    // Build hierarchy tree
    const buildTree = (employees: any[], managerId: any = null) => {
      return employees
        .filter(emp => emp.managerId?._id?.toString() === managerId?.toString())
        .map(emp => ({
          ...emp.toObject(),
          gravatarUrl: emp.getGravatarUrl(),
          children: buildTree(employees, emp._id)
        }));
    };

    return buildTree(employees);
  }

  static async getDepartments() {
    const departments = await Employee.distinct('department');
    return departments.filter(dept => dept).sort();
  }

  static async getManagers() {
    const managers = await Employee.find({ isActive: true })
      .select('firstName lastName email position')
      .sort({ firstName: 1, lastName: 1 });

    return managers.map(manager => ({
      ...manager.toObject(),
      gravatarUrl: manager.getGravatarUrl()
    }));
  }
}
