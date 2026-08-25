export interface LoginFormValues {
  username: string;
  password: string;
}

export interface RegisterFormValues {
  username: string;
  password: string;
  displayName: string;
}

export interface AuthFormContextValue {
  loginForm: LoginFormValues;
  registerForm: RegisterFormValues;
  updateLoginForm: (values: Partial<LoginFormValues>) => void;
  updateRegisterForm: (values: Partial<RegisterFormValues>) => void;
  clearLoginForm: () => void;
  clearRegisterForm: () => void;
}
