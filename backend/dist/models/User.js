"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const gremlinHelpers_1 = require("../utils/gremlinHelpers");
class User {
    /**
    /**
     * Create a new user vertex in the graph
     */
    static async create(data) {
        const g = (0, database_1.getGraphTraversal)();
        const now = new Date().toISOString();
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(12);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, salt);
        const vertex = await g
            .addV('User')
            .property('email', data.email.toLowerCase().trim())
            .property('password', hashedPassword)
            .property('firstName', data.firstName)
            .property('lastName', data.lastName)
            .property('role', data.role || 'user')
            .property('isActive', data.isActive !== undefined ? data.isActive : true)
            .property('createdAt', now)
            .property('updatedAt', now)
            .next();
        const user = await this.findOne({ email: data.email.toLowerCase().trim() });
        if (!user) {
            throw new Error('Failed to create user');
        }
        return user;
    }
    /**
     * Find user by email
     */
    static async findOne(query) {
        const g = (0, database_1.getGraphTraversal)();
        let traversal = g.V().hasLabel('User');
        if (query.email) {
            traversal = traversal.has('email', query.email.toLowerCase().trim());
        }
        const result = await traversal.valueMap(true).toList();
        if (result.length === 0)
            return null;
        return this.vertexToUser(result[0]);
    }
    /**
     * Update user vertex
     */
    static async updateById(id, data) {
        const g = (0, database_1.getGraphTraversal)();
        let traversal = g.V(id).hasLabel('User');
        // Hash password if it's being updated
        if (data.password) {
            const salt = await bcryptjs_1.default.genSalt(12);
            data.password = await bcryptjs_1.default.hash(data.password, salt);
        }
        // Update properties
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
                if (key === 'email') {
                    traversal = traversal.property(key, value.toLowerCase().trim());
                }
                else {
                    traversal = traversal.property(key, value);
                }
            }
        }
        traversal = traversal.property('updatedAt', new Date().toISOString());
        await traversal.next();
        const user = await this.findOne({ email: data.email.toLowerCase().trim() });
        if (!user) {
            throw new Error('Failed to update user');
        }
        return user;
    }
    /**
     * Compare password
     */
    static async comparePassword(userId, candidatePassword) {
        const user = await this.findOne({ email: userId });
        if (!user)
            return false;
        return bcryptjs_1.default.compare(candidatePassword, user.password);
    }
    /**
     * Convert Gremlin vertex to User object
     */
    static vertexToUser(vertex) {
        const user = {
            id: vertex.id.toString(),
        };
        // Extract properties
        if (vertex.properties) {
            for (const [key, values] of Object.entries(vertex.properties)) {
                if (Array.isArray(values) && values.length > 0) {
                    const value = values[0].value;
                    // Parse dates
                    if (key === 'createdAt' || key === 'updatedAt') {
                        user[key] = new Date(value);
                    }
                    else {
                        user[key] = value;
                    }
                }
            }
        }
        // Add computed properties
        user.gravatarUrl = (0, gremlinHelpers_1.getGravatarUrl)(user.email);
        return user;
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map