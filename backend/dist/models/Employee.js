"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
const database_1 = require("../config/database");
const gremlinHelpers_1 = require("../utils/gremlinHelpers");
class Employee {
    /**
     * Create a new employee vertex in the graph
     */
    static async create(data) {
        const g = (0, database_1.getGraphTraversal)();
        const now = new Date().toISOString();
        const vertex = await g
            .addV('Employee')
            .property('employeeId', data.employeeId)
            .property('firstName', data.firstName)
            .property('lastName', data.lastName)
            .property('email', data.email.toLowerCase().trim())
            .property('position', data.position)
            .property('department', data.department)
            .property('hireDate', data.hireDate ? new Date(data.hireDate).toISOString() : now)
            .property('salary', data.salary)
            .property('isActive', data.isActive !== undefined ? data.isActive : true)
            .property('createdAt', now)
            .property('updatedAt', now)
            .next();
        const employee = await this.findById(vertex.value.id.toString());
        // Create manager relationship if managerId is provided
        if (data.managerId) {
            await this.addManagerRelationship(vertex.value.id.toString(), data.managerId);
        }
        return employee;
    }
    /**
     * Find employee by ID
     */
    static async findById(id) {
        const g = (0, database_1.getGraphTraversal)();
        const result = await g
            .V(id)
            .hasLabel('Employee')
            .valueMap(true)
            .toList();
        if (result.length === 0)
            return null;
        const vertex = result[0];
        const employee = this.vertexToEmployee(vertex);
        // Get manager
        const managerResult = await g
            .V(id)
            .inE('MANAGES')
            .outV()
            .valueMap(true)
            .toList();
        if (managerResult.length > 0) {
            employee.managerId = managerResult[0].id.toString();
        }
        return employee;
    }
    /**
     * Find employee by property
     */
    static async findOne(query) {
        const g = (0, database_1.getGraphTraversal)();
        let traversal = g.V().hasLabel('Employee');
        for (const [key, value] of Object.entries(query)) {
            traversal = traversal.has(key, value);
        }
        const result = await traversal.valueMap(true).toList();
        if (result.length === 0)
            return null;
        return this.vertexToEmployee(result[0]);
    }
    /**
     * Find all employees matching query
     */
    static async find(query = {}) {
        const g = (0, database_1.getGraphTraversal)();
        let traversal = g.V().hasLabel('Employee');
        if (query.department) {
            traversal = traversal.has('department', query.department);
        }
        if (query.isActive !== undefined) {
            traversal = traversal.has('isActive', query.isActive);
        }
        if (query.managerId) {
            // Find employees who have a manager edge from the specified manager
            const managerEmployees = await g
                .V(query.managerId)
                .outE('MANAGES')
                .inV()
                .id()
                .toList();
            if (managerEmployees.length === 0) {
                return [];
            }
            // Get employees by their IDs
            const employeeIds = managerEmployees.map((id) => id.toString());
            const employees = await Promise.all(employeeIds.map(async (id) => {
                const result = await g.V(id).hasLabel('Employee').valueMap(true).toList();
                return result.length > 0 ? this.vertexToEmployee(result[0]) : null;
            }));
            return employees.filter(emp => emp !== null);
        }
        // If we already returned early (managerId case), this won't execute
        const result = await traversal.valueMap(true).toList();
        return result.map((v) => this.vertexToEmployee(v));
    }
    /**
     * Update employee vertex
     */
    static async updateById(id, data) {
        const g = (0, database_1.getGraphTraversal)();
        let traversal = g.V(id).hasLabel('Employee');
        // Update properties
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'managerId' && key !== 'createdAt' && value !== undefined) {
                if (key === 'email') {
                    traversal = traversal.property(key, value.toLowerCase().trim());
                }
                else if (key === 'hireDate') {
                    traversal = traversal.property(key, new Date(value).toISOString());
                }
                else {
                    traversal = traversal.property(key, value);
                }
            }
        }
        traversal = traversal.property('updatedAt', new Date().toISOString());
        await traversal.next();
        return this.findById(id);
    }
    /**
     * Delete employee vertex and its relationships
     */
    static async deleteById(id) {
        const g = (0, database_1.getGraphTraversal)();
        // Get subordinates before deletion
        const subordinates = await g
            .V(id)
            .outE('MANAGES')
            .inV()
            .id()
            .toList();
        // Reassign subordinates to the employee's manager
        const managerResult = await g
            .V(id)
            .inE('MANAGES')
            .outV()
            .id()
            .toList();
        const managerId = managerResult.length > 0 ? managerResult[0].toString() : null;
        // Update subordinates' manager relationships
        for (const subId of subordinates) {
            // Remove old manager relationship (find edge from manager to subordinate)
            const edges = await g.V(id).outE('MANAGES').where(g.inV().hasId(subId.toString())).id().toList();
            for (const edgeId of edges) {
                await g.E(edgeId.toString()).drop().iterate();
            }
            // Add new manager relationship if manager exists
            if (managerId) {
                await g.V(subId.toString()).addE('MANAGES').to(g.V(managerId)).next();
            }
            else {
                // Remove manager relationship if no manager
                await g.V(subId.toString()).inE('MANAGES').drop().iterate();
            }
        }
        // Remove all edges
        await g.V(id).bothE().drop().iterate();
        // Delete vertex
        await g.V(id).drop().iterate();
    }
    /**
     * Add manager relationship (edge)
     */
    static async addManagerRelationship(employeeId, managerId) {
        const g = (0, database_1.getGraphTraversal)();
        // Remove existing manager relationship if any
        await g.V(employeeId).inE('MANAGES').drop().iterate();
        // Add new manager relationship
        await g.V(employeeId).addE('MANAGES').to(g.V(managerId)).next();
    }
    /**
     * Get distinct departments
     */
    static async distinct(field) {
        const g = (0, database_1.getGraphTraversal)();
        const result = await g
            .V()
            .hasLabel('Employee')
            .values(field)
            .dedup()
            .toList();
        return result.filter((dept) => dept).sort();
    }
    /**
     * Convert Gremlin vertex to Employee object
     */
    static vertexToEmployee(vertex) {
        const employee = {
            id: vertex.id.toString(),
        };
        // Extract properties
        if (vertex.properties) {
            for (const [key, values] of Object.entries(vertex.properties)) {
                if (Array.isArray(values) && values.length > 0) {
                    const value = values[0].value;
                    // Parse dates
                    if (key === 'hireDate' || key === 'createdAt' || key === 'updatedAt') {
                        employee[key] = new Date(value);
                    }
                    else {
                        employee[key] = value;
                    }
                }
            }
        }
        // Add computed properties
        employee.fullName = `${employee.firstName} ${employee.lastName}`;
        employee.gravatarUrl = (0, gremlinHelpers_1.getGravatarUrl)(employee.email);
        return employee;
    }
}
exports.Employee = Employee;
//# sourceMappingURL=Employee.js.map