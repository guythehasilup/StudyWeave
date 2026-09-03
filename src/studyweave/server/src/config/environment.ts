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
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

/**
 * Describe validated, immutable process configuration.
 *
 * @example
 * const config = loadAppConfig(process.env);
 */
export type AppConfig = Readonly<{
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  mongodbUri: string;
  mongodbDatabase: string;
  mongodbMaxPoolSize: number;
  mongodbServerSelectionTimeoutMs: number;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtExpiresIn: string;
  clientOrigin: string;
  rabbitmqUrl: string;
  rabbitmqPrefetch: number;
  rabbitmqPublishConfirmTimeoutMs: number;
  shutdownTimeoutMs: number;
}>;

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
    shutdownTimeoutMs: parsed.SHUTDOWN_TIMEOUT_MS,
  };
};
