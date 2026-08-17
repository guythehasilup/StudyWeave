import { requestAuthSession } from '../../services/auth-client.service';
import type { AuthSession } from '../../types/auth-session.type';
import type { LoginInput } from '../types/login-input.type';

export const login = (input: LoginInput): Promise<AuthSession> =>
  requestAuthSession('login', input);
