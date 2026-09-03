/**
 * Describe immutable diagnostic context attached to an error log.
 *
 * @example
 * const context: ErrorLogContext = { correlationId: 'request-123' };
 */
export type ErrorLogContext = Readonly<Record<string, unknown>>;

/**
 * Describe the structured fields written for a server error.
 *
 * @property stackTrace - Native stack trace when an `Error` was thrown. Defaults to `null`.
 * @example
 * const details: ErrorLogDetails = {
 *   level: 'error',
 *   errorName: 'Error',
 *   errorMessage: 'Connection failed',
 *   stackTrace: 'Error: Connection failed',
 * };
 */
export type ErrorLogDetails = Readonly<
  Record<string, unknown> & {
    level: 'error';
    errorName: string;
    errorMessage: string;
    stackTrace: string | null;
  }
>;

/**
 * Write a structured error event to an output such as stderr.
 *
 * @example
 * const writer: ErrorLogWriter = (message, details) => console.error(message, details);
 */
export type ErrorLogWriter = (message: string, details: ErrorLogDetails) => void;

/**
 * Record an unknown thrown value with structured diagnostic context.
 *
 * @param message - Stable description of the failed server operation.
 * @param error - Thrown value captured at the failure boundary.
 * @param context - Non-sensitive identifiers useful for tracing. Defaults to empty.
 * @returns Nothing after the error event is written.
 * @example
 * logError('Database operation failed', error, { correlationId });
 */
export type ErrorLogger = (message: string, error: unknown, context?: ErrorLogContext) => void;

/**
 * Write a structured error event through `console.error` so it reaches stderr.
 *
 * @param message - Stable description of the failed server operation.
 * @param details - Structured error fields and diagnostic context.
 * @returns Nothing after the event is written.
 * @example
 * writeConsoleError('Request failed', details);
 */
const writeConsoleError: ErrorLogWriter = (message, details) => {
  console.error(message, details);
};

/**
 * Normalize a thrown value into fields safe for structured server logs.
 *
 * @param error - Unknown value caught at an error boundary.
 * @returns Error identity, diagnostic message, and native stack trace when available.
 * @example
 * const details = describeError(new Error('Connection failed'));
 */
const describeError = (
  error: unknown,
): Pick<ErrorLogDetails, 'errorName' | 'errorMessage' | 'stackTrace'> => {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack ?? null,
    };
  }

  return {
    errorName: 'UnknownError',
    errorMessage: typeof error === 'string' ? error : 'A non-Error value was thrown',
    stackTrace: null,
  };
};

/**
 * Create a structured error logger with an injectable output adapter.
 *
 * @param writeError - Error-level output adapter. Defaults to `console.error`.
 * @returns A logger that preserves stack traces and contextual identifiers.
 * @example
 * const logger = createErrorLogger();
 * logger('Request failed', error, { correlationId });
 */
export const createErrorLogger =
  (writeError: ErrorLogWriter = writeConsoleError): ErrorLogger =>
  (message, error, context = {}) => {
    writeError(message, {
      ...context,
      level: 'error',
      ...describeError(error),
    });
  };

/**
 * Record a structured server error through stderr.
 *
 * @example
 * logError('Request failed', error, { correlationId });
 */
export const logError = createErrorLogger();
