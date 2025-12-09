import { getGraphTraversal } from '../config/database';
import bcrypt from 'bcryptjs';
import { getGravatarUrl } from '../utils/gremlinHelpers';

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

export class User {
  /**
  /**
   * Create a new user vertex in the graph
   */
  static async create(data: Partial<IUser>): Promise<IUser | null> {
    const g = getGraphTraversal();
    const now = new Date().toISOString();

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password!, salt);

    const vertex = await g
      .addV('User')
      .property('email', data.email!.toLowerCase().trim())
      .property('password', hashedPassword)
      .property('firstName', data.firstName!)
      .property('lastName', data.lastName!)
      .property('role', data.role || 'user')
      .property('isActive', data.isActive !== undefined ? data.isActive : true)
      .property('createdAt', now)
      .property('updatedAt', now)
      .next();

    const user = await this.findOne({ email: data.email!.toLowerCase().trim() });
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user!;
  }

  /**
   * Find user by email
   */
  static async findOne(query: { email?: string }): Promise<IUser | null> {
    const g = getGraphTraversal();
    let traversal = g.V().hasLabel('User');

    if (query.email) {
      traversal = traversal.has('email', query.email.toLowerCase().trim());
    }

    const result = await traversal.valueMap(true).toList();
    if (result.length === 0) return null;

    return this.vertexToUser(result[0]);
  }

  /**
   * Update user vertex
   */
  static async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const g = getGraphTraversal();
    let traversal = g.V(id).hasLabel('User');

    // Hash password if it's being updated
    if (data.password) {
      const salt = await bcrypt.genSalt(12);
      data.password = await bcrypt.hash(data.password, salt);
    }

    // Update properties
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        if (key === 'email') {
          traversal = traversal.property(key, (value as string).toLowerCase().trim());
        } else {
          traversal = traversal.property(key, value);
        }
      }
    }

    traversal = traversal.property('updatedAt', new Date().toISOString());
    await traversal.next();

    const user = await this.findOne({ email: data.email!.toLowerCase().trim() });
    if (!user) {
      throw new Error('Failed to update user');
    }
    return user!;
  }

  /**
   * Compare password
   */
  static async comparePassword(userId: string, candidatePassword: string): Promise<boolean> {
    const user = await this.findOne({ email: userId });
    if (!user) return false;
    
    return bcrypt.compare(candidatePassword, user.password);
  }

  /**
   * Convert Gremlin vertex to User object
   */
  private static vertexToUser(vertex: any): IUser {
    const user: any = {
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
          } else {
            user[key] = value;
          }
        }
      }
    }

    // Add computed properties
    user.gravatarUrl = getGravatarUrl(user.email);

    return user as IUser;
  }
}
