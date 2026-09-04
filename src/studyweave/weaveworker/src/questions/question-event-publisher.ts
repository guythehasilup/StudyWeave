import type { QuestionWorkerEvent } from '@studyweave/swwai-contract';

/**
 * Publish worker-authored question status and result events.
 *
 * @example
 * const publishEvent: QuestionEventPublisher = (event) => rabbit.publish(route, event);
 */
export type QuestionEventPublisher = (event: QuestionWorkerEvent) => Promise<void>;
