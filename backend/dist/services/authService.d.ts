export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        gravatarUrl: string;
    };
}
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export declare class AuthService {
    static registerUser(data: RegisterData): Promise<AuthResponse>;
    static loginUser(data: LoginData): Promise<AuthResponse>;
    static getCurrentUser(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "admin" | "user";
        gravatarUrl: string;
    }>;
    static validateToken(token: string): Promise<any>;
    private static generateToken;
}
export declare const getUserById: (id: string) => Promise<{
    id: any;
    isActive: any;
    email: any;
    firstName: any;
    lastName: any;
    password: any;
} | null>;
//# sourceMappingURL=authService.d.ts.map