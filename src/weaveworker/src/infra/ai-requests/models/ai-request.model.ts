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
      required: true,
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
      required: true,
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
      required: true,
    },
    queuePublishLeaseUntil: {
      type: Date,
      default: null,
    },
    queuePublishAttempts: {
      type: Number,
      required: true,
    },
    cancelRequestedAt: {
      type: Date,
      default: null,
    },
    cancelPublishState: {
      type: String,
      enum: cancelPublishStates,
      required: true,
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
      required: true,
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
    completedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      index: true,
    },
  },
  {
    collection: 'ai_requests',
    timestamps: true,
  },
);

export const AiRequest = model<AiRequestDocument>('AiRequest', aiRequestSchema);
