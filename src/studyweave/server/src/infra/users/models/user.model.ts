import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { he } from '../../../common/resources/he.resource.js';
import type { UserDocument } from '../types/user.type.js';
import { usernamePattern } from '../validators/username.validator.js';

const removePassword = (
  _document: unknown,
  returnedObject: Record<string, unknown>,
): Record<string, unknown> => {
  delete returnedObject.password;
  return returnedObject;
};

const userSchema = new Schema<UserDocument>(
  {
    id: {
      type: String,
      default: () => randomUUID(),
      immutable: true,
      index: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [usernamePattern, he.validation.usernameInvalid],
      index: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: removePassword },
    toObject: { transform: removePassword },
  },
);

export const User = model<UserDocument>('User', userSchema);
