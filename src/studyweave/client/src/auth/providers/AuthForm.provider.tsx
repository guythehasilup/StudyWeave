import { useCallback, useMemo, useState } from 'react';
import { AuthFormContext, initialLoginForm, initialRegisterForm } from './auth-form.context';
import type { AuthFormProviderProps } from '../types/auth-form-provider.type';
import type { LoginFormValues, RegisterFormValues } from '../types/auth-form.type';

export const AuthFormProvider = ({ children }: AuthFormProviderProps) => {
  const [loginForm, setLoginForm] = useState<LoginFormValues>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterFormValues>(initialRegisterForm);

  const updateLoginForm = useCallback((values: Partial<LoginFormValues>): void => {
    setLoginForm((current) => ({ ...current, ...values }));
  }, []);

  const updateRegisterForm = useCallback((values: Partial<RegisterFormValues>): void => {
    setRegisterForm((current) => ({ ...current, ...values }));
  }, []);

  const clearLoginForm = useCallback((): void => setLoginForm(initialLoginForm), []);
  const clearRegisterForm = useCallback((): void => setRegisterForm(initialRegisterForm), []);

  const contextValue = useMemo(
    () => ({
      loginForm,
      registerForm,
      updateLoginForm,
      updateRegisterForm,
      clearLoginForm,
      clearRegisterForm,
    }),
    [
      loginForm,
      registerForm,
      updateLoginForm,
      updateRegisterForm,
      clearLoginForm,
      clearRegisterForm,
    ],
  );

  return <AuthFormContext.Provider value={contextValue}>{children}</AuthFormContext.Provider>;
};
