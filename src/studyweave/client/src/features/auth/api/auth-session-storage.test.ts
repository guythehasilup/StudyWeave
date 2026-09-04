import { Buffer } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthSessionDto, AuthUserDto } from '../auth.types';
import {
  getAccessToken,
  getAuthUser,
  isAccessTokenActive,
  storeAuthSession,
} from './auth-session-storage';

const USER: AuthUserDto = {
  id: 'e778be29-03dc-4d49-a3f8-48262738136b',
  username: 'student',
  displayName: 'Student',
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-09-03T10:00:00.000Z',
  updatedAt: '2026-09-03T10:00:00.000Z',
};

/** Create an unsigned JWT-shaped value for client expiration tests. */
const createAccessToken = (expiresAt: number): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(expiresAt / 1_000) })).toString(
    'base64url',
  );
  return `${header}.${payload}.signature`;
};

/** Create an in-memory implementation of browser session storage. */
const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
};

/** Install isolated session storage for one test. */
const installSessionStorage = (): Storage => {
  const storage = createMemoryStorage();
  vi.stubGlobal('sessionStorage', storage);
  return storage;
};

afterEach(() => vi.unstubAllGlobals());

describe('authentication session storage', () => {
  it('stores and exposes the access token and public user object', () => {
    const storage = installSessionStorage();
    const session: AuthSessionDto = {
      accessToken: createAccessToken(Date.now() + 60_000),
      user: USER,
    };

    storeAuthSession(session);

    expect(getAccessToken()).toBe(session.accessToken);
    expect(getAuthUser()).toEqual(USER);
    expect(JSON.parse(storage.getItem('studyweave.user') ?? 'null')).toEqual(USER);
  });

  it('clears the complete session when its JWT is expired', () => {
    const storage = installSessionStorage();
    storeAuthSession({ accessToken: createAccessToken(Date.now() - 60_000), user: USER });

    expect(getAccessToken()).toBeNull();
    expect(storage.getItem('studyweave.accessToken')).toBeNull();
    expect(storage.getItem('studyweave.user')).toBeNull();
  });

  it('treats malformed or expiration-free values as inactive', () => {
    installSessionStorage();

    expect(isAccessTokenActive('not-a-jwt')).toBe(false);
    expect(isAccessTokenActive(createAccessToken(Date.now() - 1_000))).toBe(false);
  });
});
