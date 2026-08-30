import type { BaseModel } from '../../../common/models/base.model.js';

export const aiResultOutcomes = ['completed', 'failed', 'uncertain', 'cancelled'] as const;

export const aiResultPublishStates = ['pending', 'publishing', 'published'] as const;

export type AiResultOutcome = (typeof aiResultOutcomes)[number];

export type AiResultPublishState = (typeof aiResultPublishStates)[number];

export interface AiResultOutboxDocument extends BaseModel {
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
  publishState: AiResultPublishState;
  publishLeaseUntil: Date | null;
  publishAttempts: number;
  publishedAt: Date | null;
}
