import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  RABBITMQ_URL: z.string().min(1).default('amqp://guest:guest@localhost:5672'),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(4),
  RABBITMQ_PUBLISH_CONFIRM_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  OPENAI_API_KEY: z.string().min(1, 'CONFIG_OPENAI_API_KEY_REQUIRED'),
  OPENAI_MODEL: z.string().min(1, 'CONFIG_OPENAI_MODEL_REQUIRED'),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

/**
 * Describe validated, immutable weaveworker process configuration.
 *
 * @example
 * const config = loadWorkerConfig(process.env);
 */
export type WorkerConfig = Readonly<{
  rabbitmqUrl: string;
  rabbitmqPrefetch: number;
  rabbitmqPublishConfirmTimeoutMs: number;
  openAiApiKey: string;
  openAiModel: string;
  shutdownTimeoutMs: number;
}>;

/**
 * Validate worker environment variables once at startup.
 *
 * @param environment - Untrusted process environment. Defaults to process.env.
 * @returns Normalized worker configuration.
 * @throws {ZodError} When a required setting is missing or malformed.
 * @example
 * const config = loadWorkerConfig({ OPENAI_API_KEY: key, OPENAI_MODEL: model });
 */
export const loadWorkerConfig = (environment: NodeJS.ProcessEnv = process.env): WorkerConfig => {
  const parsed = environmentSchema.parse(environment);

  return {
    rabbitmqUrl: parsed.RABBITMQ_URL,
    rabbitmqPrefetch: parsed.RABBITMQ_PREFETCH,
    rabbitmqPublishConfirmTimeoutMs: parsed.RABBITMQ_PUBLISH_CONFIRM_TIMEOUT_MS,
    openAiApiKey: parsed.OPENAI_API_KEY,
    openAiModel: parsed.OPENAI_MODEL,
    shutdownTimeoutMs: parsed.SHUTDOWN_TIMEOUT_MS,
  };
};
