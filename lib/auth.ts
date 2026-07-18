import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function isAuthenticated(token: string | undefined): boolean {
  return token === process.env.ADMIN_TOKEN;
}
