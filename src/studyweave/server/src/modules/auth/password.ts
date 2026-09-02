import argon2 from 'argon2';
import type { HashOptions } from 'argon2';

const ARGON2_OPTIONS: HashOptions & { raw: false } = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  raw: false,
};

/**
 * Hash a validated password using the service Argon2id policy.
 *
 * @param plainTextPassword - Password received over the protected HTTP boundary.
 * @returns The encoded Argon2id password hash.
 * @example
 * const passwordHash = await hashPassword('secure-passphrase');
 */
export const hashPassword = (plainTextPassword: string): Promise<string> =>
  argon2.hash(plainTextPassword, ARGON2_OPTIONS);

/**
 * Compare a supplied password with a stored Argon2 hash.
 *
 * @param passwordHash - Encoded hash loaded from owned persistence.
 * @param suppliedPassword - Plain-text password supplied during login.
 * @returns `true` only when Argon2 verifies the password.
 * @example
 * const isValid = await verifyPassword(passwordHash, suppliedPassword);
 */
export const verifyPassword = (passwordHash: string, suppliedPassword: string): Promise<boolean> =>
  argon2.verify(passwordHash, suppliedPassword);
