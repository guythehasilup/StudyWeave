import { randomUUID } from 'node:crypto';
import { aiResultOutcomes } from '@studyweave/weave-contract';
import { Schema, model } from 'mongoose';
import {
  aiResultPublishStates,
  type AiResultOutboxDocument,
} from '../types/ai-result-outbox.type.js';

const aiResultOutboxSchema = new Schema<AiResultOutboxDocument>(
  {
    id: {
      type: String,
      default: () => randomUUID(),
      immutable: true,
      index: true,
      unique: true,
    },
    requestId: {
      type: String,
      required: true,
      immutable: true,
      index: true,
      unique: true,
    },
    workerId: {
      type: String,
      required: true,
      immutable: true,
    },
    workerAttempt: {
      type: Number,
      required: true,
      immutable: true,
    },
    outcome: {
      type: String,
      enum: aiResultOutcomes,
      required: true,
      immutable: true,
    },
    responseText: {
      type: String,
      default: null,
      immutable: true,
    },
    providerResponseId: {
      type: String,
      default: null,
      immutable: true,
    },
    inputTokens: {
      type: Number,
      default: null,
      immutable: true,
    },
    outputTokens: {
      type: Number,
      default: null,
      immutable: true,
    },
    failureCode: {
      type: String,
      default: null,
      immutable: true,
    },
    completedAt: {
      type: Date,
      required: true,
      immutable: true,
    },
    publishState: {
      type: String,
      enum: aiResultPublishStates,
      default: 'pending',
      index: true,
    },
    publishLeaseUntil: {
      type: Date,
      default: null,
    },
    publishAttempts: {
      type: Number,
      default: 0,
    },
    publishedAt: {
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
    collection: 'ai_result_outbox',
    timestamps: true,
  },
);

aiResultOutboxSchema.index({ publishState: 1, publishLeaseUntil: 1, createdAt: 1 });

export const AiResultOutbox = model<AiResultOutboxDocument>('AiResultOutbox', aiResultOutboxSchema);
