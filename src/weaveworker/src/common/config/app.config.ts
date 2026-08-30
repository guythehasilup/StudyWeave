import 'dotenv/config';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const envSchema = z
  .object({
    MONGODB_URI: z.string().min(1),
    RABBITMQ_URL: z.string().min(1).default('amqp://localhost:5672'),
    AI_REQUEST_QUEUE: z.string().min(1).default('studyweave.ai.requests.v1'),
    AI_CANCEL_EXCHANGE: z.string().min(1).default('studyweave.ai.cancellations.v1'),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL: z.string().min(1).default('gpt-5.6-terra'),
    OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
    OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(1_200),
    WEAVE_WORKER_ID: z.string().min(1).optional(),
    WEAVE_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(1),
    WEAVE_WORKER_PROCESSING_LEASE_MS: z.coerce.number().int().positive().default(120_000),
    WEAVE_WORKER_HEARTBEAT_MS: z.coerce.number().int().positive().default(30_000),
    RABBITMQ_RECONNECT_DELAY_MS: z.coerce.number().int().positive().default(5_000),
  })
  .refine(
    (environment) =>
      environment.WEAVE_WORKER_HEARTBEAT_MS < environment.WEAVE_WORKER_PROCESSING_LEASE_MS,
    {
      message: 'WEAVE_WORKER_HEARTBEAT_MS must be shorter than the processing lease.',
      path: ['WEAVE_WORKER_HEARTBEAT_MS'],
    },
  );

const environment = envSchema.parse(process.env);

const generatedWorkerId = `${hostname()}:${process.pid}:${randomUUID()}`;

export const appConfig = {
  ...environment,
  WEAVE_WORKER_ID: environment.WEAVE_WORKER_ID ?? generatedWorkerId,
};
