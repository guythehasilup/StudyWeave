import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { QUESTION_MESSAGE_TYPES, createMessageEnvelope } from '@studyweave/swwai-contract';
import type { QuestionWorkerEvent } from '@studyweave/swwai-contract';
import { createCancellationRegistry } from './cancellation-registry.js';
import { createQuestionProcessor } from './question-processor.js';

const QUESTION_ID = '3ac3def8-b7c2-4ad4-881c-863471e508a3';
const USER_ID = 'e778be29-03dc-4d49-a3f8-48262738136b';
const REQUEST = createMessageEnvelope(
  QUESTION_MESSAGE_TYPES.answerRequested,
  {
    questionId: QUESTION_ID,
    userId: USER_ID,
    content: { parts: [{ type: 'text' as const, text: 'Explain inertia.' }] },
  },
  { correlationId: 'request-123' },
);

describe('question processor', () => {
  it('publishes processing and completion around the provider call', async () => {
    const events: QuestionWorkerEvent[] = [];
    const processor = createQuestionProcessor({
      acquireExecutionPermit: async () => undefined,
      cancellations: createCancellationRegistry(),
      generateAnswer: async () => ({
        answer: 'Inertia is resistance to motion change.',
        providerResponseId: 'resp-1',
      }),
      publishEvent: async (event) => {
        events.push(event);
      },
    });

    await processor.handleRequest(REQUEST);

    assert.deepEqual(
      events.map((event) => event.type),
      [QUESTION_MESSAGE_TYPES.processingStarted, QUESTION_MESSAGE_TYPES.answerCompleted],
    );
  });

  it('waits for an execution permit before publishing processing state', async () => {
    const operationOrder: string[] = [];
    const processor = createQuestionProcessor({
      acquireExecutionPermit: async () => {
        operationOrder.push('permit');
      },
      cancellations: createCancellationRegistry(),
      generateAnswer: async () => {
        operationOrder.push('provider');
        return { answer: 'One answer.', providerResponseId: null };
      },
      publishEvent: async (event) => {
        operationOrder.push(event.type);
      },
    });

    await processor.handleRequest(REQUEST);

    assert.deepEqual(operationOrder, [
      'permit',
      QUESTION_MESSAGE_TYPES.processingStarted,
      'provider',
      QUESTION_MESSAGE_TYPES.answerCompleted,
    ]);
  });

  it('honors cancellation received before the request begins', async () => {
    const events: QuestionWorkerEvent[] = [];
    const cancellations = createCancellationRegistry();
    let wasProviderCalled = false;
    const processor = createQuestionProcessor({
      acquireExecutionPermit: async () => undefined,
      cancellations,
      generateAnswer: async () => {
        wasProviderCalled = true;
        return { answer: 'unused', providerResponseId: null };
      },
      publishEvent: async (event) => {
        events.push(event);
      },
    });
    cancellations.cancel(QUESTION_ID);

    await processor.handleRequest(REQUEST);

    assert.equal(wasProviderCalled, false);
    assert.deepEqual(
      events.map((event) => event.type),
      [QUESTION_MESSAGE_TYPES.answerCancelled],
    );
  });

  it('logs provider failures once and publishes a failed event', async () => {
    const events: QuestionWorkerEvent[] = [];
    const errors: unknown[] = [];
    const providerError = new Error('Provider unavailable');
    const processor = createQuestionProcessor({
      acquireExecutionPermit: async () => undefined,
      cancellations: createCancellationRegistry(),
      generateAnswer: async () => {
        throw providerError;
      },
      publishEvent: async (event) => {
        events.push(event);
      },
      logProcessingError: (_message, error) => {
        errors.push(error);
      },
    });

    await processor.handleRequest(REQUEST);

    assert.deepEqual(
      events.map((event) => event.type),
      [QUESTION_MESSAGE_TYPES.processingStarted, QUESTION_MESSAGE_TYPES.answerFailed],
    );
    assert.deepEqual(errors, [providerError]);
  });

  it('coalesces duplicate requests running in the same worker process', async () => {
    const gate: { open?: () => void } = {};
    const waitForRelease = new Promise<void>((resolve) => {
      gate.open = resolve;
    });
    let providerCallCount = 0;
    const processor = createQuestionProcessor({
      acquireExecutionPermit: async () => undefined,
      cancellations: createCancellationRegistry(),
      generateAnswer: async () => {
        providerCallCount += 1;
        await waitForRelease;
        return { answer: 'One answer.', providerResponseId: null };
      },
      publishEvent: async () => undefined,
    });

    const firstDelivery = processor.handleRequest(REQUEST);
    const duplicateDelivery = processor.handleRequest(REQUEST);
    gate.open?.();
    await Promise.all([firstDelivery, duplicateDelivery]);

    assert.equal(providerCallCount, 1);
  });
});
