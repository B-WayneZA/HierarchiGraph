import { getDriver } from '../config/database';
import bcrypt from 'bcryptjs';
import { getGravatarUrl } from '../utils/dbHelpers';

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
   * Create a new user node in the graph
   */
  static async create(data: Partial<IUser>): Promise<IUser | null> {
    const driver = getDriver();
    const session = driver.session();
    const now = new Date().toISOString();

    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(data.password!, salt);

      const result = await session.run(
        `
        CREATE (u:User {
          id: randomUUID(),
          email: $email,
          password: $password,
          firstName: $firstName,
          lastName: $lastName,
          role: $role,
          isActive: $isActive,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        RETURN u
      `,
        {
          email: data.email!.toLowerCase().trim(),
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || 'user',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: now,
          updatedAt: now,
        }
      );

      const newUser = result.records[0].get('u').properties;
      return this.nodeToUser(newUser);
    } finally {
      await session.close();
    }
  }

  /**
   * Find user by email
   */
  static async findOne(query: { email?: string }): Promise<IUser | null> {
    if (!query.email) return null;
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run('MATCH (u:User {email: $email}) RETURN u', {
        email: query.email.toLowerCase().trim(),
      });

      if (result.records.length === 0) return null;

      return this.nodeToUser(result.records[0].get('u').properties);
    } finally {
      await session.close();
    }
  }

  /**
   * Update user node
   */
  static async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const driver = getDriver();
    const session = driver.session();
    try {
      const propertiesToUpdate = { ...data };
      delete propertiesToUpdate.id;
      delete propertiesToUpdate.createdAt;

      if (data.password) {
        const salt = await bcrypt.genSalt(12);
        propertiesToUpdate.password = await bcrypt.hash(data.password, salt);
      }

      if (Object.keys(propertiesToUpdate).length === 0) {
        const user = await this.findOne({ email: data.email });
        return user;
      }

      const result = await session.run(
        `
        MATCH (u:User {id: $id})
        SET u += $props, u.updatedAt = $updatedAt
        RETURN u
      `,
        {
          id,
          props: propertiesToUpdate,
          updatedAt: new Date().toISOString(),
        }
      );

      if (result.records.length === 0) return null;

      return this.nodeToUser(result.records[0].get('u').properties);
    } finally {
      await session.close();
    }
  }

  /**
   * Compare password
   */
  static async comparePassword(userId: string, candidatePassword: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    return bcrypt.compare(candidatePassword, user.password);
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<IUser | null> {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run('MATCH (u:User {id: $id}) RETURN u', { id });
      if (result.records.length === 0) return null;
      return this.nodeToUser(result.records[0].get('u').properties);
    } finally {
      await session.close();
    }
  }

  /**
   * Convert Neo4j Node to User object
   */
  private static nodeToUser(properties: any): IUser {
    const user: IUser = {
      id: properties.id,
      email: properties.email,
      password: properties.password,
      firstName: properties.firstName,
      lastName: properties.lastName,
      role: properties.role,
      isActive: properties.isActive,
      createdAt: new Date(properties.createdAt),
      updatedAt: new Date(properties.updatedAt),
      gravatarUrl: getGravatarUrl(properties.email),
    };
    return user;
  }
}
