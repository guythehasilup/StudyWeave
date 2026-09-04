import { useEffect, useState } from 'react';
import {
  clearAuthSession,
  isAccessTokenActive,
  readAuthSession,
  subscribeAuthSession,
} from '../api/auth-session-storage';
import type { AuthSessionDto } from '../auth.types';

/**
 * Subscribe to the validated current-tab authentication session.
 *
 * Invalid or expired stored data is removed after render. Authenticated request
 * cleanup triggers the same subscription and therefore revalidates route guards.
 *
 * @returns The current unexpired session, or null for a guest.
 * @example
 * const session = useAuthSession();
 */
export const useAuthSession = (): AuthSessionDto | null => {
  const [session, setSession] = useState<AuthSessionDto | null>(() => readAuthSession());
  const activeSession =
    session !== null && isAccessTokenActive(session.accessToken) ? session : null;

  useEffect(() => subscribeAuthSession(() => setSession(readAuthSession())), []);
  useEffect(() => {
    if (activeSession === null) clearAuthSession();
  }, [activeSession]);

  return activeSession;
};
