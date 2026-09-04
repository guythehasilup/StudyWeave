import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { ErrorLogDetails } from './error-logger.js';
import { configureErrorStackTraces, createErrorLogger, logError } from './error-logger.js';

describe('error logger', () => {
  it('preserves structured details and the native Error instance', () => {
    const entries: Array<Readonly<{ message: string; details: ErrorLogDetails; error: unknown }>> =
      [];
    const logger = createErrorLogger((message, details, error) => {
      entries.push({ message, details, error });
    });
    const error = new Error('RabbitMQ connection failed');

    logger('Question publication failed', error, { correlationId: 'request-123' });

    assert.equal(entries[0]?.message, 'Question publication failed');
    assert.equal(entries[0]?.details.level, 'error');
    assert.equal(entries[0]?.details.errorName, 'Error');
    assert.equal(entries[0]?.details.errorMessage, 'RabbitMQ connection failed');
    assert.match(entries[0]?.details.stackTrace ?? '', /Error: RabbitMQ connection failed/u);
    assert.equal(entries[0]?.details.correlationId, 'request-123');
    assert.equal(entries[0]?.error, error);
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

  it('preserves the complete stack chain for translated errors', () => {
    const entries: ErrorLogDetails[] = [];
    const logger = createErrorLogger((_message, details) => {
      entries.push(details);
    });
    const dependencyError = new Error('RabbitMQ connection failed');
    const applicationError = new Error('Question dispatch failed', { cause: dependencyError });

    logger('Server request failed', applicationError);

    assert.match(entries[0]?.stackTrace ?? '', /Error: Question dispatch failed/u);
    assert.match(entries[0]?.stackTrace ?? '', /Caused by:\nError: RabbitMQ connection failed/u);
  });

  it('can capture every available stack frame', () => {
    const previousLimit = Error.stackTraceLimit;

    try {
      configureErrorStackTraces();
      assert.equal(Error.stackTraceLimit, Number.POSITIVE_INFINITY);
    } finally {
      Error.stackTraceLimit = previousLimit;
    }
  });

  it('prints multiline errors without escaped string concatenations', () => {
    const outputs: unknown[] = [];
    mock.method(console, 'error', (...values: unknown[]) => {
      outputs.push(...values);
    });

    try {
      logError('Configuration failed', new Error('line one\nline two'), {
        service: 'weaveworker',
      });

      assert.equal(typeof outputs[0], 'string');
      assert.match(outputs[0] as string, /"level": "error"/u);
      assert.match(outputs[0] as string, /Error: line one\nline two\n\s+at/u);
      assert.doesNotMatch(outputs[0] as string, /\\n' \+/u);
    } finally {
      mock.restoreAll();
    }
  });
});
