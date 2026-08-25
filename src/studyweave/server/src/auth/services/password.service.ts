import argon2, { type HashOptions } from 'argon2';

const argon2Options: HashOptions & { raw: false } = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  raw: false,
};

export const hashPassword = (plainTextPassword: string): Promise<string> =>
  argon2.hash(plainTextPassword, argon2Options);

export const verifyPassword = (passwordHash: string, suppliedPassword: string): Promise<boolean> =>
  argon2.verify(passwordHash, suppliedPassword);
