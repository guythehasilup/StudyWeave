export const aiResultOutcomes = ['completed', 'failed', 'uncertain', 'cancelled'] as const;

export type AiResultOutcome = (typeof aiResultOutcomes)[number];

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
