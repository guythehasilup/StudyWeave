import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import {
  aiRequestStatuses,
  cancelPublishStates,
  queuePublishStates,
  type AiRequestDocument,
} from '../types/ai-request.type.js';

const aiRequestSchema = new Schema<AiRequestDocument>(
  {
    id: {
      type: String,
      default: () => randomUUID(),
      immutable: true,
      index: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    clientRequestId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8_000,
    },
    status: {
      type: String,
      enum: aiRequestStatuses,
      default: 'pending',
      index: true,
    },
    responseText: {
      type: String,
      default: null,
    },
    failureCode: {
      type: String,
      default: null,
    },
    providerResponseId: {
      type: String,
      default: null,
    },
    inputTokens: {
      type: Number,
      default: null,
    },
    outputTokens: {
      type: Number,
      default: null,
    },
    queuePublishState: {
      type: String,
      enum: queuePublishStates,
      default: 'pending',
      index: true,
    },
    queuePublishLeaseUntil: {
      type: Date,
      default: null,
    },
    queuePublishAttempts: {
      type: Number,
      default: 0,
    },
    cancelRequestedAt: {
      type: Date,
      default: null,
    },
    cancelPublishState: {
      type: String,
      enum: cancelPublishStates,
      default: 'idle',
      index: true,
    },
    cancelPublishLeaseUntil: {
      type: Date,
      default: null,
    },
    cancelPublishedAt: {
      type: Date,
      default: null,
    },
    workerId: {
      type: String,
      default: null,
    },
    workerAttempt: {
      type: Number,
      default: 0,
    },
    processingStartedAt: {
      type: Date,
      default: null,
    },
    processingLeaseUntil: {
      type: Date,
      default: null,
    },
    providerRequestStartedAt: {
      type: Date,
      default: null,
    },
    lastResultEventId: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    collection: 'ai_requests',
    timestamps: true,
  },
);

// Enforces one idempotent client request identifier per user.
aiRequestSchema.index({ userId: 1, clientRequestId: 1 }, { unique: true });

// Supports request outbox scans and recovery of expired publishing leases.
aiRequestSchema.index({ status: 1, queuePublishState: 1, queuePublishLeaseUntil: 1 });

// Supports cancellation outbox scans and recovery of expired publishing leases.
aiRequestSchema.index({ status: 1, cancelPublishState: 1, cancelPublishLeaseUntil: 1 });

export const AiRequest = model<AiRequestDocument>('AiRequest', aiRequestSchema);
