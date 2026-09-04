import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { login } from '../api/auth-api';
import type { AuthApiError } from '../api/auth-api';
import { storeAuthSession } from '../api/auth-session-storage';
import type { AuthSessionDto, LoginInput } from '../auth.types';

/**
 * Authenticate a user and synchronize the authoritative session cache.
 *
 * @returns TanStack Query mutation state and login actions.
 * @example
 * const loginMutation = useLoginMutation();
 */
export const useLoginMutation = (): UseMutationResult<AuthSessionDto, AuthApiError, LoginInput> => {
  return useMutation({
    mutationFn: login,
    onSuccess: storeAuthSession,
  });
};
