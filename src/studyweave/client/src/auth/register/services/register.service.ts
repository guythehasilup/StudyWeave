import { requestAuthSession } from '../../services/auth-client.service';
import type { AuthSession } from '../../types/auth-session.type';
import type { RegisterInput } from '../types/register-input.type';

export const register = (input: RegisterInput): Promise<AuthSession> =>
  requestAuthSession('register', input);
