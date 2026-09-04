declare global {
  namespace Express {
    /**
     * Request-scoped metadata created at the HTTP boundary.
     *
     * @example
     * const context: RequestContext = { correlationId: 'request-123' };
     */
    interface RequestContext {
      correlationId: string;
    }

    /**
     * Extend Express requests with tracing and optional authentication state.
     *
     * @example
     * request.context = { correlationId: 'request-123' };
     */
    interface Request {
      context?: RequestContext;
      /** Authenticated access-token identity populated by protected routes. */
      identity?: Readonly<{
        userId: string;
        username: string;
      }>;
    }
  }
}

export {};
