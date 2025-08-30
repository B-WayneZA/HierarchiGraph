import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';

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

export class AuthService {
  static async registerUser(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        gravatarUrl: user.getGravatarUrl()
      }
    };
  }

  static async loginUser(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        gravatarUrl: user.getGravatarUrl()
      }
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      gravatarUrl: user.getGravatarUrl()
    };
  }

  static async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private static generateToken(user: IUser): string {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}
