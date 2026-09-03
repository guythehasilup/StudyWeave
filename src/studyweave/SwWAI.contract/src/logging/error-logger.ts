/**
 * Describe immutable diagnostic context attached to an error log.
 *
 * @example
 * const context: ErrorLogContext = { correlationId: 'request-123' };
 */
export type ErrorLogContext = Readonly<Record<string, unknown>>;

/**
 * Describe the structured fields written for a service error.
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
 * Write a structured error event and its original thrown value to an error-level output.
 *
 * @example
 * const writer: ErrorLogWriter = (message, details, error) =>
 *   console.error(message, details, error);
 */
export type ErrorLogWriter = (message: string, details: ErrorLogDetails, error: unknown) => void;

/**
 * Record an unknown thrown value with structured diagnostic context.
 *
 * @param message - Stable description of the failed service operation.
 * @param error - Thrown value captured at the failure boundary.
 * @param context - Non-sensitive identifiers useful for tracing. Defaults to empty.
 * @returns Nothing after the error event is written.
 * @example
 * logError('Message processing failed', error, { correlationId });
 */
export type ErrorLogger = (message: string, error: unknown, context?: ErrorLogContext) => void;

/**
 * Write one readable multiline error block through stderr.
 *
 * Error messages and stacks are intentionally excluded from the inspected
 * metadata object so Node does not display multiline strings as `\n` fragments
 * joined by `+` operators.
 *
 * @param message - Stable description of the failed service operation.
 * @param details - Structured error fields and diagnostic context.
 * @param error - Original thrown value printed natively after the structured fields.
 * @returns Nothing after the event is written.
 * @example
 * writeConsoleError('Request failed', details, error);
 */
const writeConsoleError: ErrorLogWriter = (message, details, error) => {
  const { errorMessage, stackTrace, ...metadata } = details;
  const formattedError =
    stackTrace ??
    (error instanceof Error
      ? `${error.name}: ${error.message}`
      : `${details.errorName}: ${errorMessage}`);

  console.error(`${message}\n${JSON.stringify(metadata, null, 2)}\n${formattedError}`);
};

/**
 * Remove Node's default ten-frame limit from subsequently captured error stacks.
 *
 * @returns Nothing after updating the process-wide error capture limit.
 * @example
 * configureErrorStackTraces();
 */
export const configureErrorStackTraces = (): void => {
  Error.stackTraceLimit = Number.POSITIVE_INFINITY;
};

/**
 * Normalize a thrown value into fields safe for structured service logs.
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
 * @returns A logger that preserves native errors, full stack traces, and contextual identifiers.
 * @example
 * const logger = createErrorLogger();
 * logger('Message processing failed', error, { correlationId });
 */
export const createErrorLogger =
  (writeError: ErrorLogWriter = writeConsoleError): ErrorLogger =>
  (message, error, context = {}) => {
    writeError(
      message,
      {
        ...context,
        level: 'error',
        ...describeError(error),
      },
      error,
    );
  };

/**
 * Record a structured service error and its native stack through stderr.
 *
 * @example
 * logError('Message processing failed', error, { correlationId });
 */
export const logError = createErrorLogger();
