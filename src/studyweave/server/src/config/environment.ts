import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, 'CONFIG_MONGODB_URI_REQUIRED'),
  MONGODB_DATABASE: z.string().min(1).default('studyweave'),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(20),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  JWT_SECRET: z.string().min(32, 'CONFIG_JWT_SECRET_TOO_SHORT'),
  JWT_ISSUER: z.string().min(1).default('studyweave-server'),
  JWT_AUDIENCE: z.string().min(1).default('studyweave-client'),
  JWT_EXPIRES_IN: z.string().min(1).default('1h'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  RABBITMQ_URL: z.string().min(1).default('amqp://guest:guest@localhost:5672'),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(4),
  RABBITMQ_PUBLISH_CONFIRM_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  QUESTION_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
  QUESTION_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

/**
 * Describe validated, immutable process configuration.
 *
 * @example
 * const config = loadAppConfig(process.env);
 */
export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly mongodbUri: string;
  readonly mongodbDatabase: string;
  readonly mongodbMaxPoolSize: number;
  readonly mongodbServerSelectionTimeoutMs: number;
  readonly jwtSecret: string;
  readonly jwtIssuer: string;
  readonly jwtAudience: string;
  readonly jwtExpiresIn: string;
  readonly clientOrigin: string;
  readonly rabbitmqUrl: string;
  readonly rabbitmqPrefetch: number;
  readonly rabbitmqPublishConfirmTimeoutMs: number;
  readonly questionRateLimitMaxRequests: number;
  readonly questionRateLimitWindowMs: number;
  readonly shutdownTimeoutMs: number;
}

/**
 * Validate environment variables once at process startup.
 *
 * @param environment - Untrusted process environment. Defaults to `process.env`.
 * @returns Normalized immutable application configuration.
 * @throws {ZodError} When required configuration is missing or malformed.
 * @example
 * const config = loadAppConfig({ MONGODB_URI: 'mongodb://localhost/studyweave', JWT_SECRET: secret });
 */
export const loadAppConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
  const parsed = environmentSchema.parse(environment);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    mongodbUri: parsed.MONGODB_URI,
    mongodbDatabase: parsed.MONGODB_DATABASE,
    mongodbMaxPoolSize: parsed.MONGODB_MAX_POOL_SIZE,
    mongodbServerSelectionTimeoutMs: parsed.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    jwtSecret: parsed.JWT_SECRET,
    jwtIssuer: parsed.JWT_ISSUER,
    jwtAudience: parsed.JWT_AUDIENCE,
    jwtExpiresIn: parsed.JWT_EXPIRES_IN,
    clientOrigin: parsed.CLIENT_ORIGIN,
    rabbitmqUrl: parsed.RABBITMQ_URL,
    rabbitmqPrefetch: parsed.RABBITMQ_PREFETCH,
    rabbitmqPublishConfirmTimeoutMs: parsed.RABBITMQ_PUBLISH_CONFIRM_TIMEOUT_MS,
    questionRateLimitMaxRequests: parsed.QUESTION_RATE_LIMIT_MAX_REQUESTS,
    questionRateLimitWindowMs: parsed.QUESTION_RATE_LIMIT_WINDOW_MS,
    shutdownTimeoutMs: parsed.SHUTDOWN_TIMEOUT_MS,
  };
};
