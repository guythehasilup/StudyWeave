import type { AiResultOutcome } from '@studyweave/weave-contract';

export interface StageAiResultInput {
  requestId: string;
  workerId: string;
  workerAttempt: number;
  outcome: AiResultOutcome;
  responseText: string | null;
  providerResponseId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  failureCode: string | null;
  completedAt: Date;
}
