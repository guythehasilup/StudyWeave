import type { AiCancellationCommand, AiRequestCommand } from '@studyweave/weave-contract';

export type QueueMessageDisposition = 'ack' | 'requeue';

export type QueueMessageHandler = (command: AiRequestCommand) => Promise<QueueMessageDisposition>;

export type CancellationMessageHandler = (command: AiCancellationCommand) => Promise<void>;
