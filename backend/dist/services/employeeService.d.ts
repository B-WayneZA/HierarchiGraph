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
export declare class EmployeeService {
    static getAllEmployees(filters?: EmployeeFilters): Promise<any[]>;
    static getEmployeeById(id: string): Promise<any>;
    static createEmployee(data: CreateEmployeeData): Promise<any>;
    static updateEmployee(id: string, data: UpdateEmployeeData): Promise<any>;
    static deleteEmployee(id: string): Promise<{
        message: string;
    }>;
    static getHierarchyGraphData(): Promise<any[]>;
    static getDepartments(): Promise<string[]>;
    static getManagers(): Promise<{
        id: string | undefined;
        firstName: string;
        lastName: string;
        email: string;
        position: string;
        gravatarUrl: string;
    }[]>;
    static getAvatar(email: string): Promise<string | null>;
    /**
     * Populate manager and subordinates for an employee
     */
    private static populateEmployeeRelations;
}
//# sourceMappingURL=employeeService.d.ts.map