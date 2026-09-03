import { randomUUID } from 'node:crypto';
import { z } from 'zod';

/**
 * Wrap a versioned application message with tracing and delivery metadata.
 *
 * @property causationId - Message that caused this message. Defaults to absent for an initial command.
 * @example
 * const message: MessageEnvelope<'example.created.v1', { id: string }> = {
 *   messageId,
 *   type: 'example.created.v1',
 *   version: 1,
 *   occurredAt,
 *   correlationId,
 *   payload: { id },
 * };
 */
export type MessageEnvelope<TType extends string, TPayload> = Readonly<{
  messageId: string;
  type: TType;
  version: 1;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  payload: Readonly<TPayload>;
}>;

/**
 * Supply tracing values when creating a versioned message envelope.
 *
 * @property causationId - Message that caused the new message. Defaults to absent.
 * @property messageId - Stable message identifier. Defaults to a generated UUID.
 * @property occurredAt - Event time. Defaults to the current time.
 * @example
 * const context: CreateMessageContext = { correlationId: requestId };
 */
export type CreateMessageContext = Readonly<{
  correlationId: string;
  causationId?: string;
  messageId?: string;
  occurredAt?: Date;
}>;

/**
 * Create an immutable version-one message envelope.
 *
 * @param type - Stable versioned message type.
 * @param payload - Contract-specific immutable payload.
 * @param context - Correlation metadata with optional IDs and time.
 * @returns A complete message ready for transport serialization.
 * @example
 * const message = createMessageEnvelope('example.created.v1', { id }, { correlationId });
 */
export const createMessageEnvelope = <TType extends string, TPayload>(
  type: TType,
  payload: Readonly<TPayload>,
  context: CreateMessageContext,
): MessageEnvelope<TType, TPayload> => ({
  messageId: context.messageId ?? randomUUID(),
  type,
  version: 1,
  occurredAt: (context.occurredAt ?? new Date()).toISOString(),
  correlationId: context.correlationId,
  ...(context.causationId === undefined ? {} : { causationId: context.causationId }),
  payload,
});

/**
 * Build a runtime schema for one literal versioned message type.
 *
 * @param type - Required message-type literal.
 * @param payloadSchema - Runtime validator for the message payload.
 * @returns A strict-enough envelope schema with the supplied payload.
 * @example
 * const schema = createMessageSchema('example.created.v1', z.object({ id: z.string() }));
 */
export const createMessageSchema = <TType extends string, TPayloadSchema extends z.ZodType>(
  type: TType,
  payloadSchema: TPayloadSchema,
) =>
  z
    .object({
      messageId: z.string().uuid(),
      type: z.literal(type),
      version: z.literal(1),
      occurredAt: z.string().datetime({ offset: true }),
      correlationId: z.string().trim().min(1).max(128),
      causationId: z.string().uuid().optional(),
      payload: payloadSchema,
    })
    .readonly();
