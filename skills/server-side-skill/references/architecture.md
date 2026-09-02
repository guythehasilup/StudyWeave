# Express microservice architecture

## Contents

1. Service boundaries
2. Dependency direction
3. Suggested folder structure
4. HTTP request flow
5. Errors and responses
6. Configuration and lifecycle
7. Testing strategy

## 1. Service boundaries

Define a service around a business capability, not a technical layer. A service must own its writes and expose its capability through an HTTP contract, an event contract, or both.

Prefer a modular monolith until independently deployable ownership, scaling, availability, or release cadence justifies a service split. Avoid distributed transactions when a local operation can meet the requirement.

For every proposed service, identify:

- the capability it owns;
- the collections it alone writes;
- synchronous APIs it exposes;
- events it publishes and consumes;
- behavior when each dependency is unavailable.

## 2. Dependency direction

Use this direction:

```text
HTTP or message adapter -> application operation -> domain policy
                                      |
                                      v
                           repository/publisher port
                                      |
                                      v
                         MongoDB/RabbitMQ adapter
```

Do not pass `Request`, `Response`, MongoDB driver documents, `Collection` objects, channels, or delivery objects into domain logic. Convert persistence and transport values to plain typed application values at the boundary.

Use classes only when an instance must protect mutable lifecycle state or an external framework requires one. Prefer factory functions and plain functions for controllers, services, mapping, and validation.

## 3. Suggested folder structure

Use feature-first modules inside each independently deployed service:

```text
services/
  users-service/
    src/
      app.ts
      server.ts
      config/
        environment.ts
      common/
        errors/
        http/
        logging/
      infrastructure/
        mongodb/
          mongo-client.ts
        rabbitmq/
          rabbitmq-connection.ts
      modules/
        users/
          user.contracts.ts
          user.document.ts
          user.repository.ts
          user.service.ts
          user.controller.ts
          user.routes.ts
          user.events.ts
          user.test.ts
      bootstrap/
        create-application.ts
```

Keep `app.ts` responsible for middleware and routes. Keep `server.ts` responsible for process startup, listening, signals, and shutdown. Do not place business rules in either file.

## 4. HTTP request flow

Use this sequence:

1. Attach request/correlation context.
2. Apply security middleware and body-size limits.
3. Authenticate and authorize.
4. Validate params, query, and body.
5. Map the transport DTO to application input.
6. Execute exactly one application operation.
7. Map the result to an HTTP response.
8. Let centralized error middleware map known errors and hide unknown details.

```ts
/**
 * Create a user from validated application input.
 *
 * @param input - Immutable values required to create the user.
 * @returns The created public user DTO.
 * @example
 * const user = await createUser({ username: 'guy' });
 */
export type CreateUser = (
  input: Readonly<CreateUserInput>,
) => Promise<Readonly<UserDto>>;

/**
 * Create the HTTP handler that registers a user.
 *
 * @param createUser - Application operation used after request validation.
 * @returns An Express handler with no domain logic.
 * @example
 * router.post('/users', validate(createUserSchema), createCreateUserHandler(createUser));
 */
export const createCreateUserHandler =
  (createUser: CreateUser): RequestHandler =>
  async (request, response, next) => {
    try {
      const user = await createUser(request.body);
      response.status(201).json({ data: user });
    } catch (error: unknown) {
      next(error);
    }
  };
```

## 5. Errors and responses

Return predictable response envelopes. Prefer an error code that the frontend maps to a localized resource.

```ts
/**
 * Describe the stable client-safe payload returned for a known API failure.
 *
 * @property details - Optional non-sensitive structured context. Defaults to absent.
 * @example
 * const error: ApiErrorBody = {
 *   code: 'USER_NOT_FOUND',
 *   resourceKey: 'users.errors.notFound',
 *   correlationId,
 * };
 */
export type ApiErrorBody = Readonly<{
  code: 'USER_NOT_FOUND' | 'USERNAME_ALREADY_EXISTS';
  resourceKey: 'users.errors.notFound' | 'users.errors.usernameAlreadyExists';
  correlationId: string;
  details?: Readonly<Record<string, unknown>>;
}>;
```

Do not return translated sentences, stack traces, MongoDB messages, queue details, or exception names. Use HTTP status codes consistently: `400` malformed input, `401` unauthenticated, `403` unauthorized, `404` missing resource, `409` state conflict, and `500` unexpected failure.

## 6. Configuration and lifecycle

- Read environment variables once during bootstrap and validate them into an immutable config object.
- Pass config and dependencies through factories.
- Separate readiness from liveness. Readiness may depend on required infrastructure; liveness should indicate that the process is functioning.
- Stop accepting new HTTP work on shutdown, stop consumers, await bounded in-flight work, close RabbitMQ, then close MongoDB.
- Set explicit HTTP, MongoDB, and RabbitMQ timeouts. Never allow unbounded retries in a request path.

## 7. Testing strategy

- Unit-test pure domain policies and application orchestration with fake ports.
- Integration-test repositories against a real compatible MongoDB instance.
- Integration-test publishers and consumers against RabbitMQ when acknowledgement or topology behavior matters.
- Contract-test public HTTP DTOs and versioned event schemas.
- Test duplicate event delivery, dependency timeout, invalid input, partial failure, and graceful shutdown paths.
