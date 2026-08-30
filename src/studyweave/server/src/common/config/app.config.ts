import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default('studyweave-server'),
  JWT_AUDIENCE: z.string().min(1).default('studyweave-client'),
  JWT_EXPIRES_IN: z.string().min(1).default('1h'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  RABBITMQ_URL: z.string().min(1).default('amqp://localhost:5672'),
  AI_REQUEST_QUEUE: z.string().min(1).default('studyweave.ai.requests.v1'),
  AI_CANCEL_EXCHANGE: z.string().min(1).default('studyweave.ai.cancellations.v1'),
  AI_REQUEST_PUBLISH_INTERVAL_MS: z.coerce.number().int().positive().default(2_000),
  AI_REQUEST_PUBLISH_LEASE_MS: z.coerce.number().int().positive().default(30_000),
});

export const appConfig = envSchema.parse(process.env);
