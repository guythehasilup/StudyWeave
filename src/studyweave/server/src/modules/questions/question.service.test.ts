import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QUESTION_MESSAGE_TYPES, QUESTION_STATUSES } from '@studyweave/swwai-contract';
import type { QuestionDto, QuestionMessage } from '@studyweave/swwai-contract';
import { ApiError } from '../../common/errors/api-error.js';
import type { QuestionRepository } from './question.repository.js';
import type { WorkerQuestionUpdate } from './question.repository.js';
import { createQuestionService } from './question.service.js';

const USER_ID = 'e778be29-03dc-4d49-a3f8-48262738136b';
const QUESTION_ID = '3ac3def8-b7c2-4ad4-881c-863471e508a3';
const CONTENT = { parts: [{ type: 'text' as const, text: 'Explain inertia.' }] } as const;
const QUESTION: QuestionDto = {
  id: QUESTION_ID,
  content: CONTENT,
  status: QUESTION_STATUSES.queued,
  response: null,
  createdAt: '2026-09-03T10:00:00.000Z',
  updatedAt: '2026-09-03T10:00:00.000Z',
};

/**
 * Build deterministic question dependencies with optional overrides.
 *
 * @param repositoryOverrides - Fake persistence operations replaced by a test. Defaults to none.
 * @returns Fake repository and captured published messages.
 * @example
 * const dependencies = createDependencies();
 */
const createDependencies = (repositoryOverrides: Partial<QuestionRepository> = {}) => {
  const messages: QuestionMessage[] = [];
  const questions: QuestionRepository = {
    createQuestion: async () => QUESTION,
    findQuestionForUser: async () => QUESTION,
    markDispatchFailed: async () => undefined,
    markCancelledByUser: async () => ({
      ...QUESTION,
      status: QUESTION_STATUSES.cancelled,
    }),
    applyWorkerUpdate: async () => undefined,
    ...repositoryOverrides,
  };

  return {
    messages,
    service: createQuestionService({
      questions,
      publishMessage: async (message) => {
        messages.push(message);
      },
    }),
  };
};

describe('question service', () => {
  it('persists and publishes a question without waiting for an answer', async () => {
    const { messages, service } = createDependencies();
    const result = await service.create(USER_ID, { content: CONTENT }, 'request-123');

    assert.equal(result.status, QUESTION_STATUSES.queued);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.type, QUESTION_MESSAGE_TYPES.answerRequested);
  });

  it('preserves the broker failure as the cause of a dispatch API error', async () => {
    const brokerError = new Error('RabbitMQ channel closed');
    const questions: QuestionRepository = {
      createQuestion: async () => QUESTION,
      findQuestionForUser: async () => QUESTION,
      markDispatchFailed: async () => undefined,
      markCancelledByUser: async () => QUESTION,
      applyWorkerUpdate: async () => undefined,
    };
    const service = createQuestionService({
      questions,
      publishMessage: async () => {
        throw brokerError;
      },
    });

    await assert.rejects(
      service.create(USER_ID, { content: CONTENT }, 'request-123'),
      (error: unknown) =>
        error instanceof ApiError &&
        error.code === 'QUESTION_DISPATCH_FAILED' &&
        error.cause === brokerError,
    );
  });

  it('does not reveal a question owned by another user', async () => {
    const { service } = createDependencies({ findQuestionForUser: async () => null });

    await assert.rejects(
      service.get(USER_ID, QUESTION_ID),
      (error: unknown) => error instanceof ApiError && error.code === 'QUESTION_NOT_FOUND',
    );
  });

  it('publishes cancellation before returning terminal cancelled state', async () => {
    const { messages, service } = createDependencies();
    const result = await service.cancel(USER_ID, QUESTION_ID, 'request-123');

    assert.equal(result.status, QUESTION_STATUSES.cancelled);
    assert.equal(messages[0]?.type, QUESTION_MESSAGE_TYPES.cancellationRequested);
  });

  it('forwards completed answers and provider identifiers to response persistence', async () => {
    const updates: WorkerQuestionUpdate[] = [];
    const { service } = createDependencies({
      applyWorkerUpdate: async (update) => {
        updates.push(update);
      },
    });

    await service.applyWorkerEvent({
      messageId: '2777ec46-0aa9-4e24-8ee8-ecfaffb6df0f',
      type: QUESTION_MESSAGE_TYPES.answerCompleted,
      version: 1,
      occurredAt: '2026-09-03T10:00:01.000Z',
      correlationId: 'request-123',
      payload: {
        questionId: QUESTION_ID,
        userId: USER_ID,
        answer: 'Inertia is resistance to a change in motion.',
        providerResponseId: 'resp_123',
      },
    });

    assert.deepEqual(updates[0], {
      questionId: QUESTION_ID,
      userId: USER_ID,
      messageId: '2777ec46-0aa9-4e24-8ee8-ecfaffb6df0f',
      occurredAt: new Date('2026-09-03T10:00:01.000Z'),
      status: QUESTION_STATUSES.completed,
      answer: 'Inertia is resistance to a change in motion.',
      providerResponseId: 'resp_123',
    });
  });
});
