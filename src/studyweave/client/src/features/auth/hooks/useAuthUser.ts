import type { AuthUserDto } from '../auth.types';
import { useAuthSession } from './useAuthSession';

/**
 * Access the public user object associated with the current browser-tab session.
 *
 * @returns The authenticated public user, or null for an expired/absent session.
 * @example
 * const user = useAuthUser();
 */
export const useAuthUser = (): AuthUserDto | null => useAuthSession()?.user ?? null;
