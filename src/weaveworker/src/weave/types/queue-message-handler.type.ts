export type QueueMessageDisposition = 'ack' | 'requeue';

export type QueueMessageHandler = (content: Buffer) => Promise<QueueMessageDisposition>;

export type CancellationMessageHandler = (content: Buffer) => Promise<void>;
