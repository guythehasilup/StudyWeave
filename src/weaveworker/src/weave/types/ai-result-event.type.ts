import type { AiResultOutcome } from '../../infra/ai-results/types/ai-result-outbox.type.js';

export interface AiResultEvent {
  version: 1;
  eventId: string;
  requestId: string;
  workerId: string;
  workerAttempt: number;
  outcome: AiResultOutcome;
  responseText: string | null;
  providerResponseId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  failureCode: string | null;
  completedAt: string;
}
