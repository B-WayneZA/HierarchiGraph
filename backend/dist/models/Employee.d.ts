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
export interface EmployeeVertex extends IEmployee {
    subordinates?: string[];
}
export declare class Employee {
    /**
     * Create a new employee vertex in the graph
     */
    static create(data: Partial<IEmployee>): Promise<IEmployee>;
    /**
     * Find employee by ID
     */
    static findById(id: string): Promise<IEmployee | null>;
    /**
     * Find employee by property
     */
    static findOne(query: {
        [key: string]: any;
    }): Promise<IEmployee | null>;
    /**
     * Find all employees matching query
     */
    static find(query?: {
        [key: string]: any;
    }): Promise<IEmployee[]>;
    /**
     * Update employee vertex
     */
    static updateById(id: string, data: Partial<IEmployee>): Promise<IEmployee | null>;
    /**
     * Delete employee vertex and its relationships
     */
    static deleteById(id: string): Promise<void>;
    /**
     * Add manager relationship (edge)
     */
    static addManagerRelationship(employeeId: string, managerId: string): Promise<void>;
    /**
     * Get distinct departments
     */
    static distinct(field: string): Promise<string[]>;
    /**
     * Convert Gremlin vertex to Employee object
     */
    private static vertexToEmployee;
}
//# sourceMappingURL=Employee.d.ts.map