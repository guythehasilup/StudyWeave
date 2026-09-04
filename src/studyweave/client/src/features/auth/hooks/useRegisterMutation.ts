import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { register } from '../api/auth-api';
import type { AuthApiError } from '../api/auth-api';
import { storeAuthSession } from '../api/auth-session-storage';
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
  return useMutation({
    mutationFn: register,
    onSuccess: storeAuthSession,
  });
};
