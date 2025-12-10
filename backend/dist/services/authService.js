"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const gremlinHelpers_1 = require("../utils/gremlinHelpers");
class AuthService {
    static async registerUser(data) {
        const { email, password, firstName, lastName } = data;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Create new user
        const user = await User_1.User.create({
            email,
            password,
            firstName,
            lastName,
            role: 'user',
            isActive: true,
        });
        // Generate JWT token
        const token = this.generateToken(user);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                gravatarUrl: user.gravatarUrl || (0, gremlinHelpers_1.getGravatarUrl)(user.email),
            },
        };
    }
    static async loginUser(data) {
        const { email, password } = data;
        // Find user
        const user = await User_1.User.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }
        // Verify password
        const isPasswordValid = await User_1.User.comparePassword(user.id, password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Generate JWT token
        const token = this.generateToken(user);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                gravatarUrl: user.gravatarUrl || (0, gremlinHelpers_1.getGravatarUrl)(user.email),
            },
        };
    }
    static async getCurrentUser(userId) {
        const user = await User_1.User.findOne({ email: userId });
        if (!user) {
            throw new Error('User not found');
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            gravatarUrl: user.gravatarUrl || (0, gremlinHelpers_1.getGravatarUrl)(user.email),
        };
    }
    static async validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET ?? 'fallback-secret', { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' });
    }
}
exports.AuthService = AuthService;
const getUserById = async (id) => {
    const g = (0, gremlinHelpers_1.getTraversal)();
    const result = await g.V(id)
        .hasLabel("user")
        .valueMap(true) // include id and all properties
        .next();
    if (result.done || !result.value)
        return null;
    const raw = result.value;
    // Convert Neptune valueMap format
    const user = {
        id: raw.id,
        isActive: raw.value.isActive?.[0] ?? false,
        email: raw.value.email?.[0] ?? null,
        firstName: raw.value.firstName?.[0] ?? "",
        lastName: raw.value.lastName?.[0] ?? "",
        password: raw.value.password?.[0] ?? null
    };
    return user;
};
exports.getUserById = getUserById;
//# sourceMappingURL=authService.js.map