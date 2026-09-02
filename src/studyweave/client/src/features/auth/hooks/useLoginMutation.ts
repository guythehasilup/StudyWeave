import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { login } from '../api/auth-api';
import type { AuthApiError } from '../api/auth-api';
import { authQueryKeys } from '../api/auth-query-keys';
import { storeAccessToken } from '../api/token-storage';
import type { AuthSessionDto, LoginInput } from '../auth.types';

/**
 * Authenticate a user and synchronize the authoritative session cache.
 *
 * @returns TanStack Query mutation state and login actions.
 * @example
 * const loginMutation = useLoginMutation();
 */
export const useLoginMutation = (): UseMutationResult<AuthSessionDto, AuthApiError, LoginInput> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      storeAccessToken(session.accessToken);
      queryClient.setQueryData(authQueryKeys.session(), session);
    },
  });
};
