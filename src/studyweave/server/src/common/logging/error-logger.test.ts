import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ErrorLogDetails } from './error-logger.js';
import { createErrorLogger } from './error-logger.js';

describe('error logger', () => {
  it('marks Error instances as errors and preserves their stack traces', () => {
    const entries: Array<Readonly<{ message: string; details: ErrorLogDetails }>> = [];
    const logger = createErrorLogger((message, details) => {
      entries.push({ message, details });
    });
    const error = new Error('RabbitMQ connection failed');

    logger('Question publication failed', error, { correlationId: 'request-123' });

    assert.equal(entries[0]?.message, 'Question publication failed');
    assert.equal(entries[0]?.details.level, 'error');
    assert.equal(entries[0]?.details.errorName, 'Error');
    assert.equal(entries[0]?.details.errorMessage, 'RabbitMQ connection failed');
    assert.match(entries[0]?.details.stackTrace ?? '', /Error: RabbitMQ connection failed/u);
    assert.equal(entries[0]?.details.correlationId, 'request-123');
  });

  it('describes non-Error thrown values without inventing a stack trace', () => {
    const entries: ErrorLogDetails[] = [];
    const logger = createErrorLogger((_message, details) => {
      entries.push(details);
    });

    logger('Unexpected failure', 'connection closed');

    assert.equal(entries[0]?.errorName, 'UnknownError');
    assert.equal(entries[0]?.errorMessage, 'connection closed');
    assert.equal(entries[0]?.stackTrace, null);
  });
});
