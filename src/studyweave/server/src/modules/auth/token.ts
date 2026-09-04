import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { AppConfig } from '../../config/environment.js';

/**
 * Represent the validated application claims carried by an access token.
 *
 * @example
 * const identity: AccessTokenIdentity = { userId: payload.sub, username: payload.username };
 */
export type AccessTokenIdentity = Readonly<{
  userId: string;
  username: string;
}>;

/**
 * Expose access-token creation and verification without global configuration.
 *
 * @example
 * const tokens = createTokenService(config);
 */
export type TokenService = Readonly<{
  createAccessToken: (identity: AccessTokenIdentity) => string;
  verifyAccessToken: (accessToken: string) => AccessTokenIdentity | null;
}>;

/**
 * Create JWT operations bound to validated service configuration.
 *
 * @param config - Validated JWT secret, issuer, audience, and lifetime.
 * @returns Functions for issuing and validating access tokens.
 * @example
 * const tokens = createTokenService(config);
 */
export const createTokenService = (config: AppConfig): TokenService => {
  const signOptions: SignOptions = {
    algorithm: 'HS256',
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };

  /**
   * Issue an access token for one authenticated identity.
   *
   * @param identity - Public user ID and normalized username.
   * @returns A signed JWT using the configured issuer and audience.
   * @example
   * const token = createAccessToken({ userId: user.id, username: user.username });
   */
  const createAccessToken = (identity: AccessTokenIdentity): string =>
    jwt.sign({ username: identity.username }, config.jwtSecret, {
      ...signOptions,
      subject: identity.userId,
    });

  /**
   * Verify and narrow an untrusted bearer token to application identity.
   *
   * @param accessToken - Encoded bearer token received from an HTTP request.
   * @returns Validated user identity, or `null` for an invalid or expired token.
   * @example
   * const identity = verifyAccessToken(requestToken);
   */
  const verifyAccessToken = (accessToken: string): AccessTokenIdentity | null => {
    try {
      const payload = jwt.verify(accessToken, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      });

      return typeof payload !== 'string' &&
        typeof payload.sub === 'string' &&
        typeof payload.username === 'string'
        ? { userId: payload.sub, username: payload.username }
        : null;
    } catch {
      return null;
    }
  };

  return { createAccessToken, verifyAccessToken };
};
