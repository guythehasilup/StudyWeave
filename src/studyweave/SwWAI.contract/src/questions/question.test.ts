import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { questionDtoSchema } from './question.js';

const QUESTION_BASE = {
  id: '3ac3def8-b7c2-4ad4-881c-863471e508a3',
  content: { parts: [{ type: 'text' as const, text: 'Explain inertia.' }] },
  createdAt: '2026-09-03T10:00:00.000Z',
  updatedAt: '2026-09-03T10:00:01.000Z',
};

describe('question contract', () => {
  it('accepts a queued question without a response', () => {
    const result = questionDtoSchema.safeParse({
      ...QUESTION_BASE,
      status: 'queued',
      response: null,
    });

    assert.equal(result.success, true);
  });

  it('accepts a completed question with a nested response', () => {
    const result = questionDtoSchema.safeParse({
      ...QUESTION_BASE,
      status: 'completed',
      response: {
        id: '2777ec46-0aa9-4e24-8ee8-ecfaffb6df0f',
        answer: 'Inertia is resistance to a change in motion.',
        errorCode: null,
        providerResponseId: 'resp_123',
        createdAt: '2026-09-03T10:00:01.000Z',
      },
    });

    assert.equal(result.success, true);
  });

  it('rejects the legacy inline answer shape', () => {
    const result = questionDtoSchema.safeParse({
      ...QUESTION_BASE,
      status: 'completed',
      answer: 'Legacy inline answer.',
      errorCode: null,
    });

    assert.equal(result.success, false);
  });
});
