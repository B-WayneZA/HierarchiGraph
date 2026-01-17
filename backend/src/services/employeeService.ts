import { Employee, IEmployee } from '../models/Employee';
import { getDriver } from '../config/database';
import { getGravatarUrl } from '../utils/dbHelpers';

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

    const employees = await Employee.find(query);

    // Populate manager and subordinates for each employee
    const employeesWithRelations = await Promise.all(
      employees.map(async (emp) => {
        const employee = await Employee.findById(emp.id!);
        if (!employee) return null;
        const populated = await this.populateEmployeeRelations(employee!);
        return {
          ...populated,
          gravatarUrl: populated.gravatarUrl || getGravatarUrl(populated.email),
        };
      })
    );

    const validEmployees = employeesWithRelations.filter((e) => e !== null) as (IEmployee & {
      gravatarUrl: string;
    })[];

    // Sort by firstName, lastName
    return validEmployees.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  static async getEmployeeById(id: string) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const populated = await this.populateEmployeeRelations(employee);
    return {
      ...populated,
      gravatarUrl: populated.gravatarUrl || getGravatarUrl(populated.email),
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
    const employee = await Employee.create({
      ...data,
      isActive: true,
    });

    const populated = await this.populateEmployeeRelations(employee);
    return {
      ...populated,
      gravatarUrl: populated.gravatarUrl || getGravatarUrl(populated.email),
    };
  }

  static async updateEmployee(id: string, data: UpdateEmployeeData) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const oldManagerId = employee.managerId;

    // Update employee properties (excluding managerId)
    const updateData: any = { ...data };
    delete updateData.managerId;

    await Employee.updateById(id, updateData);

    // Handle manager change
    if (data.managerId !== undefined && data.managerId !== oldManagerId) {
      // Add to new manager's subordinates
      if (data.managerId) {
        await Employee.addManagerRelationship(id, data.managerId);
      } else {
        // Remove manager relationship
        const driver = getDriver();
        const session = driver.session();
        try {
          await session.run(
            `MATCH (:Employee)-[r:MANAGES]->(e:Employee {id: $id}) DELETE r`,
            { id }
          );
        } finally {
          await session.close();
        }
      }
    }

    const finalEmployee = await Employee.findById(id);
    const populated = await this.populateEmployeeRelations(finalEmployee!);
    return {
      ...populated,
      gravatarUrl: populated.gravatarUrl || getGravatarUrl(populated.email),
    };
  }

  static async deleteEmployee(id: string) {
    const employee = await Employee.findById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }

    await Employee.deleteById(id);
    return { message: 'Employee deleted successfully' };
  }

  static async getHierarchyGraphData() {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (e:Employee)
        OPTIONAL MATCH (m:Employee)-[:MANAGES]->(e)
        RETURN e, m.id as managerId
      `);

      const nodes = result.records.map((record) => {
        const employee = record.get('e').properties;
        return {
          _id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          department: employee.department,
          email: employee.email,
          gravatarUrl: getGravatarUrl(employee.email),
          managerId: record.get('managerId'),
          children: [],
        };
      });

      const map: Record<string, any> = {};
      nodes.forEach((node) => {
        map[node._id] = node;
      });

      const roots: any[] = [];
      nodes.forEach((node) => {
        if (node.managerId && map[node.managerId]) {
          map[node.managerId].children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    } finally {
      await session.close();
    }
  }

  static async getDepartments() {
    const departments = await Employee.distinct('department');
    return departments.filter(dept => dept).sort();
  }

  static async getManagers() {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (m:Employee)-[:MANAGES]->(:Employee)
        WHERE m.isActive = true
        RETURN DISTINCT m
        ORDER BY m.firstName, m.lastName
      `);

      return result.records.map((record) => {
        const manager = record.get('m').properties;
        return {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName,
          email: manager.email,
          position: manager.position,
          gravatarUrl: getGravatarUrl(manager.email),
        };
      });
    } finally {
      await session.close();
    }
  }

  static async getAvatar(email: string) {
    const employee = await Employee.findOne({ email });
    return employee ? getGravatarUrl(email) : null;
  }

  /**
   * Populate manager and subordinates for an employee
   */
  private static async populateEmployeeRelations(employee: IEmployee): Promise<any> {
    const driver = getDriver();
    const session = driver.session();
    const result: any = { ...employee };

    try {
      if (employee.id) {
        // Get manager
        const managerResult = await session.run(
          `MATCH (m:Employee)-[:MANAGES]->(e:Employee {id: $id}) RETURN m`,
          { id: employee.id }
        );

        if (managerResult.records.length > 0) {
          const managerNode = managerResult.records[0].get('m').properties;
          result.managerId = {
            id: managerNode.id,
            firstName: managerNode.firstName,
            lastName: managerNode.lastName,
            email: managerNode.email,
            position: managerNode.position,
          };
        }

        // Get subordinates
        const subordinatesResult = await session.run(
          `MATCH (e:Employee {id: $id})-[:MANAGES]->(s:Employee) RETURN s`,
          { id: employee.id }
        );

        result.subordinates = subordinatesResult.records.map((record) => {
          const subNode = record.get('s').properties;
          return {
            id: subNode.id,
            firstName: subNode.firstName,
            lastName: subNode.lastName,
            email: subNode.email,
            position: subNode.position,
          };
        });
      }
    } finally {
      await session.close();
    }

    return result;
  }
}
