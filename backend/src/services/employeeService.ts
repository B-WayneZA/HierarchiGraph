import { Employee, IEmployee } from '../models/Employee';
import { getGraphTraversal } from '../config/database';
import { getGravatarUrl } from '../utils/gremlinHelpers';

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
        const populated = await this.populateEmployeeRelations(employee!);
        return {
          ...populated,
          gravatarUrl: populated.gravatarUrl || getGravatarUrl(populated.email),
        };
      })
    );

    // Sort by firstName, lastName
    return employeesWithRelations.sort((a, b) => {
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
      managerId: data.managerId || null,
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

    const updatedEmployee = await Employee.updateById(id, updateData);

    // Handle manager change
    if (data.managerId !== undefined && data.managerId !== oldManagerId) {
      // Remove from old manager's subordinates (handled by edge removal)
      if (oldManagerId) {
        // Edge will be removed when we add new one
      }

      // Add to new manager's subordinates
      if (data.managerId) {
        await Employee.addManagerRelationship(id, data.managerId);
      } else {
        // Remove manager relationship
        const g = getGraphTraversal();
        await g.V(id).inE('MANAGES').drop().iterate();
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
    const g = getGraphTraversal();

    // 1. Get all employees
    const vertices = await g.V().hasLabel("Employee").valueMap(true).toList();

    // 2. Create map by id
    const map: Record<string, any> = {};
    vertices.forEach((v: any) => {
      map[ v.id ] = {
        _id: v.id,
        firstName: v.properties.firstName[ 0 ],
        lastName: v.properties.lastName[ 0 ],
        position: v.properties.position[ 0 ],
        department: v.properties.department[ 0 ],
        email: v.properties.email[ 0 ],
        gravatarUrl: getGravatarUrl(v.properties.email[ 0 ]),
        children: []
      };
    });

    // 3. Query all management edges (MANAGES)
    const edges = await g.E().hasLabel("MANAGES").toList();

    // Build children relationships
    edges.forEach((edge: any) => {
      const managerId = edge.outV.id;
      const employeeId = edge.inV.id;

      if (map[ managerId ] && map[ employeeId ]) {
        map[ managerId ].children.push(map[ employeeId ]);
        map[ employeeId ].managerId = managerId;
      }
    });

    // 4. Return only roots (employees with no manager)
    return Object.values(map).filter((emp: any) => !emp.managerId);
  }

  static async getDepartments() {
    const departments = await Employee.distinct('department');
    return departments.filter(dept => dept).sort();
  }

  static async getManagers() {
    const g = getGraphTraversal();

    // Get all employees who manage others (have outgoing MANAGES edges)
    const managerIds = await g
      .V()
      .hasLabel('Employee')
      .has('isActive', true)
      .where(g.outE('MANAGES'))
      .id()
      .dedup()
      .toList();

    const allManagerIds = [ ...new Set(managerIds.map((id: any) => id.toString())) ];

    const managers = await Promise.all(
      allManagerIds.map(async (id: any) => {
        const emp = await Employee.findById(id.toString());
        if (!emp) return null;
        return {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          position: emp.position,
          gravatarUrl: getGravatarUrl(emp.email),
        };
      })
    );

    return managers.filter(m => m !== null).sort((a, b) => {
      const nameA = `${a!.firstName} ${a!.lastName}`.toLowerCase();
      const nameB = `${b!.firstName} ${b!.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  static async getAvatar(email: string) {
    const employee = await Employee.findOne({ email });
    return employee ? getGravatarUrl(email) : null;
  }

  /**
   * Populate manager and subordinates for an employee
   */
  private static async populateEmployeeRelations(employee: IEmployee): Promise<any> {
    const g = getGraphTraversal();
    const result: any = { ...employee };

    // Get manager
    if (employee.id) {
      const managerResult = await g
        .V(employee.id)
        .inE('MANAGES')
        .outV()
        .valueMap(true)
        .toList();

      if (managerResult.length > 0) {
        const managerVertex = managerResult[ 0 ];
        result.managerId = {
          id: managerVertex.id.toString(),
          firstName: managerVertex.properties?.firstName?.[ 0 ]?.value,
          lastName: managerVertex.properties?.lastName?.[ 0 ]?.value,
          email: managerVertex.properties?.email?.[ 0 ]?.value,
          position: managerVertex.properties?.position?.[ 0 ]?.value,
        };
      }

      // Get subordinates
      const subordinatesResult = await g
        .V(employee.id)
        .outE('MANAGES')
        .inV()
        .valueMap(true)
        .toList();

      result.subordinates = subordinatesResult.map((subVertex: any) => ({
        id: subVertex.id.toString(),
        firstName: subVertex.properties?.firstName?.[ 0 ]?.value,
        lastName: subVertex.properties?.lastName?.[ 0 ]?.value,
        email: subVertex.properties?.email?.[ 0 ]?.value,
        position: subVertex.properties?.position?.[ 0 ]?.value,
      }));
    }

    return result;
  }
}
