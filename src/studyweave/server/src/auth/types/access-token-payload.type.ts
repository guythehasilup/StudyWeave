import type { JwtPayload } from 'jsonwebtoken';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  username: string;
}
