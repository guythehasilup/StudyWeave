---
name: build-express-microservices
description: Design, implement, refactor, or review TypeScript backend services built with Express, the official MongoDB Node.js driver, RabbitMQ, and a microservice architecture. Use for API routes, controllers, services, repositories, typed MongoDB collections, queries, schemas and indexes, RabbitMQ publishers or consumers, service boundaries, reliability, observability, testing, backend folder structure, or backend architecture decisions in this stack.
---

# Build Express Microservices

Build production-oriented TypeScript services around explicit boundaries, owned data, reliable messaging, and observable failure behavior.

## Apply companion conventions

Apply `$apply-shared-code-conventions` alongside this skill for TypeScript declarations, documentation, naming, errors, and English/Hebrew resources. If the companion skill is unavailable, still use `const` by default, avoid classes without a concrete need, document every function and complex type, and return stable error/resource keys instead of human-readable API messages.

## Follow the backend decision process

1. Inspect the existing repository, package versions, conventions, runtime constraints, and tests before choosing a pattern.
2. State the service responsibility and the data it owns in one or two sentences. Reject boundaries that require multiple services to write the same collection.
3. Define the external contract first: HTTP request/response DTOs or message event schema, validation, version, and error codes.
4. Model success, invalid input, duplicate delivery, dependency timeout, partial failure, shutdown, and retry behavior before implementation.
5. Choose MongoDB document shapes and indexes from actual access patterns. Use the official `mongodb` Node.js driver and its TypeScript types; do not introduce Mongoose, an ODM, or `mongosh` application scripts.
6. Choose RabbitMQ delivery semantics explicitly. Assume at-least-once delivery and make consumers idempotent.
7. Implement one vertical slice through route or consumer, application service, repository or publisher, and tests.
8. Verify behavior with automated tests and focused runtime checks. Report assumptions and meaningful tradeoffs without exposing hidden chain-of-thought.

## Enforce architecture rules

- Keep Express routes and controllers thin: parse, validate, authorize, call one application operation, and translate the result to HTTP.
- Put use-case orchestration in application services. Keep MongoDB and RabbitMQ APIs in infrastructure adapters.
- Keep domain rules independent of Express request/response objects, MongoDB driver documents, and RabbitMQ delivery objects.
- Give each service exclusive write ownership of its database or collections. Integrate through APIs or events, not cross-service database writes.
- Validate all untrusted input at every boundary, including HTTP payloads, query parameters, environment variables, and consumed messages.
- Use dependency injection through explicit factory parameters. Avoid process-wide mutable singletons and service-locator imports.
- Use structured error objects with stable codes. Do not leak stack traces or internal dependency messages to clients.
- Use structured logs with correlation, causation, request, and message identifiers where available. Literal log text is allowed; product and API text must use resource keys.
- Make startup fail fast on invalid configuration. Implement graceful shutdown for HTTP, MongoDB, RabbitMQ channels, and in-flight work.
- Prefer the smallest pattern that satisfies current reliability needs. Explain when an outbox, transaction, saga, cache, or class is justified.

## Load detailed guidance as needed

- Read [architecture.md](references/architecture.md) for service boundaries, request flow, dependency construction, folder structure, errors, configuration, and shutdown.
- Read [mongodb.md](references/mongodb.md) whenever configuring the official MongoDB Node.js driver or modeling typed documents, collections, indexes, repositories, pagination, updates, or transactions.
- Read [rabbitmq.md](references/rabbitmq.md) whenever publishing or consuming messages, defining topology, retries, acknowledgements, idempotency, or an outbox.

## Verify the result

- Confirm the route or consumer performs boundary validation.
- Confirm all application persistence uses the official `mongodb` package rather than Mongoose, an ODM, `mongosh`, or raw database scripts.
- Confirm every MongoDB query has a justified shape, typed driver inputs and outputs, and a supporting index where needed.
- Confirm consumers tolerate redelivery and acknowledge only after successful processing.
- Confirm errors have stable codes and logs contain useful structured context.
- Confirm unit tests cover domain/application decisions and integration tests cover infrastructure behavior.
- Confirm generated code follows the shared documentation and localization conventions.
