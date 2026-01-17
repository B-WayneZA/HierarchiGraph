import crypto from 'crypto';

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
