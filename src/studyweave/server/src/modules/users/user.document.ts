/**
 * Represent one user in the users service-owned MongoDB collection.
 *
 * @example
 * const user: UserDocument = {
 *   id: crypto.randomUUID(),
 *   username: 'student',
 *   passwordHash,
 *   displayName: 'Student',
 *   isActive: true,
 *   isDeleted: false,
 *   lastLoginAt: null,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 */
export type UserDocument = Readonly<{
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  isActive: boolean;
  isDeleted: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;
