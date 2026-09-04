import { Buffer } from 'node:buffer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthUser, storeAuthSession } from '../../auth/api/auth-session-storage';
import type { AuthUserDto } from '../../auth/auth.types';
import { getQuestion, QuestionApiError } from './questions-api';

const USER: AuthUserDto = {
  id: 'e778be29-03dc-4d49-a3f8-48262738136b',
  username: 'student',
  displayName: 'Student',
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-09-03T10:00:00.000Z',
  updatedAt: '2026-09-03T10:00:00.000Z',
};

/** Create an active unsigned JWT-shaped value for client request tests. */
const createActiveAccessToken = (): string => {
  const header = Buffer.from('{}').toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1_000) + 60 }),
  ).toString('base64url');
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

afterEach(() => vi.unstubAllGlobals());

describe('question API authentication', () => {
  it('clears the browser session when the server rejects a token', async () => {
    vi.stubGlobal('sessionStorage', createMemoryStorage());
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'AUTHENTICATION_REQUIRED',
            resourceKey: 'auth.errors.authenticationRequired',
            correlationId: 'request-123',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    storeAuthSession({ accessToken: createActiveAccessToken(), user: USER });

    await expect(
      getQuestion('3ac3def8-b7c2-4ad4-881c-863471e508a3', new AbortController().signal),
    ).rejects.toBeInstanceOf(QuestionApiError);
    expect(getAuthUser()).toBeNull();
  });
});
