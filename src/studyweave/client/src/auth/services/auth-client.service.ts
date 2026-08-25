import { he } from '../../common/resources/he.resource';
import { storeAccessToken } from '../storage/token.storage';
import type { AuthErrorResponse } from '../types/auth-error-response.type';
import type { AuthSession } from '../types/auth-session.type';

const apiUrl = import.meta.env.VITE_API_URL;

export const requestAuthSession = async (
  endpoint: 'login' | 'register',
  body: object,
): Promise<AuthSession> => {
  const response = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json().catch((): AuthErrorResponse => ({}))) as AuthErrorResponse;
    throw new Error(error.message ?? he.auth.requestFailed);
  }

  const session = (await response.json()) as AuthSession;

  if (!session.accessToken) {
    throw new Error(he.auth.invalidResponse);
  }

  storeAccessToken(session.accessToken);
  return session;
};
