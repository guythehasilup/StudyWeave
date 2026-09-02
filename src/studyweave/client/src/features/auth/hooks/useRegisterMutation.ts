import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { register } from '../api/auth-api';
import type { AuthApiError } from '../api/auth-api';
import { authQueryKeys } from '../api/auth-query-keys';
import { storeAccessToken } from '../api/token-storage';
import type { AuthSessionDto, RegisterInput } from '../auth.types';

/**
 * Register a user and synchronize the authoritative session cache.
 *
 * @returns TanStack Query mutation state and registration actions.
 * @example
 * const registerMutation = useRegisterMutation();
 */
export const useRegisterMutation = (): UseMutationResult<
  AuthSessionDto,
  AuthApiError,
  RegisterInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: (session) => {
      storeAccessToken(session.accessToken);
      queryClient.setQueryData(authQueryKeys.session(), session);
    },
  });
};
