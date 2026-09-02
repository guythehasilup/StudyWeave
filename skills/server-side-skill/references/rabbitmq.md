# RabbitMQ conventions

## Contents

1. Contract and topology
2. Publishing
3. Consuming and acknowledgements
4. Idempotency
5. Retries and dead letters
6. Outbox and observability

## 1. Contract and topology

Name events in past tense because they describe facts, for example `user.registered.v1`. Include an explicit schema version. Keep routing topology in code or declarative infrastructure, not in manual broker setup.

Use durable exchanges and queues for business events. Give each consuming service its own queue. Never let two different logical consumers share a queue unless competing consumption is intentional.

Use a standard envelope:

```ts
/**
 * Wrap a versioned integration event with tracing and delivery metadata.
 *
 * @property causationId - Identifier of the event that caused this event. Defaults to absent for an initial command.
 * @example
 * const event: IntegrationEvent<'user.registered.v1', UserRegisteredPayload> = {
 *   eventId,
 *   type: 'user.registered.v1',
 *   version: 1,
 *   occurredAt,
 *   correlationId,
 *   payload,
 * };
 */
export type IntegrationEvent<TType extends string, TPayload> = Readonly<{
  eventId: string;
  type: TType;
  version: 1;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  payload: Readonly<TPayload>;
}>;
```

Do not place secrets, password hashes, or unnecessary personal data in messages.

## 2. Publishing

- Use publisher confirms for messages whose loss matters.
- Set persistent delivery mode, content type, event identifier, and timestamp.
- Bound publish waits and handle channel closure.
- Treat a successful publish as broker acceptance, not downstream completion.
- Use an outbox when a database change and event publication must not diverge.

## 3. Consuming and acknowledgements

Assume at-least-once delivery. Use manual acknowledgement. Acknowledge only after all required processing and durable writes succeed.

```ts
/**
 * Handle one user-registered delivery and acknowledge it after durable success.
 *
 * @param message - RabbitMQ delivery; `null` means the consumer was cancelled.
 * @returns A promise that settles after acknowledgement or rejection.
 * @example
 * await channel.consume(queueName, handleUserRegistered, { noAck: false });
 */
export const handleUserRegistered = async (
  message: ConsumeMessage | null,
): Promise<void> => {
  if (message === null) return;

  try {
    const event = parseUserRegistered(message.content);
    await processUserRegisteredOnce(event);
    channel.ack(message);
  } catch (error: unknown) {
    // Persist or confirm-publish the delivery to a bounded retry queue or DLQ.
    const disposition = await routeFailedDelivery(message, error);
    channel.ack(message);
    logger.error('User event processing failed', {
      disposition,
      messageId: message.properties.messageId,
      error,
    });
  }
};
```

Do not requeue immediately in a tight loop. Pause new deliveries during graceful shutdown and wait for bounded in-flight work.

Set prefetch from measured concurrency and downstream capacity. Do not use a large arbitrary value.

## 4. Idempotency

Persist a processed `eventId`, use an operation-specific unique key, or make the write itself conditional. Perform the idempotency record and domain write atomically when possible.

Do not use only an in-memory set: it disappears on restart and does not coordinate replicas.

## 5. Retries and dead letters

Classify failures:

- transient dependency failures: retry with bounded exponential backoff and jitter;
- invalid schema or permanent business rejection: dead-letter immediately;
- unknown failures: retry a small bounded number, then dead-letter.

Implement delayed retries with retry queues plus TTL/dead-letter routing or a broker-supported delayed mechanism. Carry retry count in headers and preserve the original event identifier.

Never silently discard a business event. Monitor dead-letter queue depth and provide a deliberate replay procedure that remains idempotent.

## 6. Outbox and observability

Use the transactional outbox pattern when changing MongoDB state and publishing an event as one logical operation. Write the domain change and outbox record in the same transaction, then let a separate publisher deliver and mark the outbox record. Use a MongoDB deployment that supports transactions, such as a replica set.

Track publish confirms, consumer latency, unacked messages, retries, dead letters, handler failures, and connection recovery. Include `eventId`, `type`, `correlationId`, and `causationId` in structured logs.
