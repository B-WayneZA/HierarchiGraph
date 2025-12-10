export interface IUser {
    id?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    gravatarUrl?: string;
}
export declare class User {
    /**
    /**
     * Create a new user vertex in the graph
     */
    static create(data: Partial<IUser>): Promise<IUser | null>;
    /**
     * Find user by email
     */
    static findOne(query: {
        email?: string;
    }): Promise<IUser | null>;
    /**
     * Update user vertex
     */
    static updateById(id: string, data: Partial<IUser>): Promise<IUser | null>;
    /**
     * Compare password
     */
    static comparePassword(userId: string, candidatePassword: string): Promise<boolean>;
    /**
     * Convert Gremlin vertex to User object
     */
    private static vertexToUser;
}
//# sourceMappingURL=User.d.ts.map