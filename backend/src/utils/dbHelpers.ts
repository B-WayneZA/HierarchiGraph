import crypto from 'crypto';
import { User } from '../models/User';
import { IUser } from '../models/User';
/**
 * Generate Gravatar URL from email
 */
export const getGravatarUrl = (email: string, size: number = 200): string => {
  if (!email) {
    // Return a default or placeholder image URL if email is not provided
    const defaultAvatar = process.env.GRAVATAR_DEFAULT || 'identicon';
    return `https://www.gravatar.com/avatar/?s=${size}&d=${defaultAvatar}`;
  }
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  const defaultAvatar = process.env.GRAVATAR_DEFAULT || 'identicon';
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultAvatar}`;
};


export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  // Remove password from response
  const { password, ...userWithoutPassword } = user!;

  return {
    id: user.id!,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    gravatarUrl: user.gravatarUrl || getGravatarUrl(user.email),
  };
}