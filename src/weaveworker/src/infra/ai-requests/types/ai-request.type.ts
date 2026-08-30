import type { BaseModel } from '../../../common/models/base.model.js';

export const aiRequestStatuses = [
  'pending',
  'queued',
  'processing',
  'cancel_requested',
  'completed',
  'failed',
  'uncertain',
  'cancelled',
] as const;

export const queuePublishStates = ['pending', 'publishing', 'published'] as const;

export const cancelPublishStates = ['idle', 'pending', 'publishing', 'published'] as const;

export type AiRequestStatus = (typeof aiRequestStatuses)[number];

export type QueuePublishState = (typeof queuePublishStates)[number];

export type CancelPublishState = (typeof cancelPublishStates)[number];

export interface AiRequestDocument extends BaseModel {
  userId: string;
  clientRequestId: string;
  message: string;
  status: AiRequestStatus;
  responseText: string | null;
  failureCode: string | null;
  providerResponseId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  queuePublishState: QueuePublishState;
  queuePublishLeaseUntil: Date | null;
  queuePublishAttempts: number;
  cancelRequestedAt: Date | null;
  cancelPublishState: CancelPublishState;
  cancelPublishLeaseUntil: Date | null;
  cancelPublishedAt: Date | null;
  workerId: string | null;
  workerAttempt: number;
  processingStartedAt: Date | null;
  processingLeaseUntil: Date | null;
  providerRequestStartedAt: Date | null;
  lastResultEventId: string | null;
  completedAt: Date | null;
}
