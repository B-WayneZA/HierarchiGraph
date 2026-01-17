import { getDriver } from '../config/database';
import { getGravatarUrl } from '../utils/dbHelpers';
import { QueryResult, Record as Neo4jRecord } from 'neo4j-driver';

export interface IEmployee {
  id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hireDate: Date | string;
  salary: number;
  managerId?: string | null;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  gravatarUrl?: string;
  fullName?: string;
}

export class Employee {
  /**
   * Create a new employee node in the graph
   */
  static async create(data: Partial<IEmployee>): Promise<IEmployee> {
    const driver = getDriver();
    const session = driver.session();
    const now = new Date().toISOString();

    try {
      const result = await session.run(
        `
        CREATE (e:Employee {
          id: randomUUID(),
          employeeId: $employeeId,
          firstName: $firstName,
          lastName: $lastName,
          email: $email,
          position: $position,
          department: $department,
          hireDate: $hireDate,
          salary: $salary,
          isActive: $isActive,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        RETURN e
      `,
        {
          employeeId: data.employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email!.toLowerCase().trim(),
          position: data.position,
          department: data.department,
          hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : now,
          salary: data.salary,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: now,
          updatedAt: now,
        }
      );

      const newEmployee = result.records[0].get('e').properties;

      if (data.managerId) {
        await this.addManagerRelationship(newEmployee.id, data.managerId);
      }

      return (await this.findById(newEmployee.id))!;
    } finally {
      await session.close();
    }
  }

  /**
   * Find employee by ID
   */
  static async findById(id: string): Promise<IEmployee | null> {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run(
        `
        MATCH (e:Employee {id: $id})
        OPTIONAL MATCH (m:Employee)-[:MANAGES]->(e)
        RETURN e, m.id AS managerId
      `,
        { id }
      );

      if (result.records.length === 0) return null;

      const record = result.records[0];
      const employeeNode = record.get('e').properties;
      const managerId = record.get('managerId');

      return this.nodeToEmployee(employeeNode, managerId);
    } finally {
      await session.close();
    }
  }

  /**
   * Find employee by property
   */
  static async findOne(query: { [key: string]: any }): Promise<IEmployee | null> {
    const driver = getDriver();
    const session = driver.session();
    try {
      const queryParts = Object.keys(query).map((key) => `e.${key} = $${key}`);
      const queryString = `MATCH (e:Employee) WHERE ${queryParts.join(' AND ')} RETURN e LIMIT 1`;

      const result = await session.run(queryString, query);

      if (result.records.length === 0) return null;

      return this.nodeToEmployee(result.records[0].get('e').properties);
    } finally {
      await session.close();
    }
  }

  /**
   * Find all employees matching query
   */
  static async find(query: { [key: string]: any } = {}): Promise<IEmployee[]> {
    const driver = getDriver();
    const session = driver.session();
    try {
      let whereClauses: string[] = [];
      let cypherQuery = 'MATCH (e:Employee)';

      if (query.department) {
        whereClauses.push('e.department = $department');
      }
      if (query.isActive !== undefined) {
        whereClauses.push('e.isActive = $isActive');
      }
      if (query.managerId) {
        cypherQuery += `\nMATCH (:Employee {id: $managerId})-[:MANAGES]->(e)`;
      }

      if (whereClauses.length > 0) {
        cypherQuery += `\nWHERE ${whereClauses.join(' AND ')}`;
      }

      cypherQuery += '\nRETURN e';

      const result = await session.run(cypherQuery, query);
      return result.records.map((record) => this.nodeToEmployee(record.get('e').properties));
    } finally {
      await session.close();
    }
  }

  /**
   * Update employee node
   */
  static async updateById(id: string, data: Partial<IEmployee>): Promise<IEmployee | null> {
    const driver = getDriver();
    const session = driver.session();
    try {
      const propertiesToUpdate = { ...data };
      delete propertiesToUpdate.id;
      delete propertiesToUpdate.managerId;
      delete propertiesToUpdate.createdAt;

      if (Object.keys(propertiesToUpdate).length === 0) {
        return this.findById(id);
      }

      const result = await session.run(
        `
        MATCH (e:Employee {id: $id})
        SET e += $props, e.updatedAt = $updatedAt
        RETURN e
      `,
        {
          id,
          props: propertiesToUpdate,
          updatedAt: new Date().toISOString(),
        }
      );

      if (result.records.length === 0) return null;

      return this.findById(id);
    } finally {
      await session.close();
    }
  }

  /**
   * Delete employee node and its relationships
   */
  static async deleteById(id: string): Promise<void> {
    const driver = getDriver();
    const session = driver.session();
    try {
      // Reassign subordinates to the deleted employee's manager
      await session.run(
        `
        MATCH (manager:Employee)-[:MANAGES]->(deleted:Employee {id: $id})-[:MANAGES]->(subordinate:Employee)
        MERGE (manager)-[:MANAGES]->(subordinate)
      `,
        { id }
      );

      // Detach and delete the employee
      await session.run(
        `
        MATCH (e:Employee {id: $id})
        DETACH DELETE e
      `,
        { id }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Add manager relationship (edge)
   */
  static async addManagerRelationship(employeeId: string, managerId: string): Promise<void> {
    const driver = getDriver();
    const session = driver.session();
    try {
      // Remove existing manager relationship
      await session.run(
        `
        MATCH (e:Employee {id: $employeeId})-[r:MANAGES]->()
        DELETE r
      `,
        { employeeId }
      );

      // Add new manager relationship
      await session.run(
        `
        MATCH (e:Employee {id: $employeeId})
        MATCH (m:Employee {id: $managerId})
        MERGE (m)-[:MANAGES]->(e)
      `,
        { employeeId, managerId }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Get distinct departments
   */
  static async distinct(field: string): Promise<string[]> {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (e:Employee)
        RETURN collect(DISTINCT e.${field}) AS values
      `);
      return result.records[0].get('values').filter((v: any) => v).sort();
    } finally {
      await session.close();
    }
  }

  /**
   * Convert Neo4j Node to Employee object
   */
  private static nodeToEmployee(properties: any, managerId: string | null = null): IEmployee {
    const employee: IEmployee = {
      id: properties.id,
      employeeId: properties.employeeId,
      firstName: properties.firstName,
      lastName: properties.lastName,
      email: properties.email,
      position: properties.position,
      department: properties.department,
      hireDate: new Date(properties.hireDate),
      salary: Number(properties.salary),
      isActive: properties.isActive,
      createdAt: new Date(properties.createdAt),
      updatedAt: new Date(properties.updatedAt),
      managerId: managerId,
      fullName: `${properties.firstName} ${properties.lastName}`,
      gravatarUrl: getGravatarUrl(properties.email),
    };
    return employee;
  }
}
