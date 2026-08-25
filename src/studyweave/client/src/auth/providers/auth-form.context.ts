import { createContext } from 'react';
import type {
  AuthFormContextValue,
  LoginFormValues,
  RegisterFormValues,
} from '../types/auth-form.type';

export const initialLoginForm: LoginFormValues = {
  username: '',
  password: '',
};

export const initialRegisterForm: RegisterFormValues = {
  displayName: '',
  username: '',
  password: '',
};

export const AuthFormContext = createContext<AuthFormContextValue | null>(null);
