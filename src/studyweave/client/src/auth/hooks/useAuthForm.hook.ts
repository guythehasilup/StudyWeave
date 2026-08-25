import { useContext } from 'react';
import { he } from '../../common/resources/he.resource';
import { AuthFormContext } from '../providers/auth-form.context';
import type { AuthFormContextValue } from '../types/auth-form.type';

export const useAuthForm = (): AuthFormContextValue => {
  const context = useContext(AuthFormContext);

  if (!context) {
    throw new Error(he.errors.authFormProviderMissing);
  }

  return context;
};
