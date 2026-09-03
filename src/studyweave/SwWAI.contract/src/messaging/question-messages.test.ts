import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createMessageEnvelope } from './message-envelope.js';
import {
  QUESTION_MESSAGE_TYPES,
  questionAnswerRequestedMessageSchema,
  questionWorkerEventSchema,
} from './question-messages.js';

const MESSAGE_ID = 'cce25fdc-14c8-4c86-bf52-63c9992928f3';
const QUESTION_ID = '3ac3def8-b7c2-4ad4-881c-863471e508a3';
const USER_ID = 'e778be29-03dc-4d49-a3f8-48262738136b';

describe('question message contracts', () => {
  it('creates and validates a versioned text question request', () => {
    const message = createMessageEnvelope(
      QUESTION_MESSAGE_TYPES.answerRequested,
      {
        questionId: QUESTION_ID,
        userId: USER_ID,
        content: { parts: [{ type: 'text' as const, text: 'Explain inertia.' }] },
      },
      {
        correlationId: 'request-123',
        messageId: MESSAGE_ID,
        occurredAt: new Date('2026-09-03T10:00:00.000Z'),
      },
    );

    assert.deepEqual(questionAnswerRequestedMessageSchema.parse(message), message);
  });

  it('rejects an unknown worker event version', () => {
    const result = questionWorkerEventSchema.safeParse({
      messageId: MESSAGE_ID,
      type: QUESTION_MESSAGE_TYPES.processingStarted,
      version: 2,
      occurredAt: '2026-09-03T10:00:00.000Z',
      correlationId: 'request-123',
      payload: { questionId: QUESTION_ID, userId: USER_ID },
    });

    assert.equal(result.success, false);
  });
});
