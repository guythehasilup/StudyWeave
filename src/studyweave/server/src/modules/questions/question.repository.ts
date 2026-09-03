import { randomUUID } from 'node:crypto';
import { QUESTION_STATUSES } from '@studyweave/swwai-contract';
import type { QuestionContent, QuestionDto } from '@studyweave/swwai-contract';
import type { Collection, Filter, UpdateFilter } from 'mongodb';
import type { QuestionDocument } from './question.document.js';

/**
 * Values required to persist a new queued question.
 *
 * @example
 * const input: CreateQuestionRecord = { userId, content };
 */
export type CreateQuestionRecord = Readonly<{
  userId: string;
  content: QuestionContent;
}>;

/**
 * Values required to apply a worker-authored status transition.
 *
 * @property answer - Completed answer. Defaults to absent for non-completion events.
 * @property errorCode - Stable failure code. Defaults to absent for non-failure events.
 * @example
 * const update: WorkerQuestionUpdate = { questionId, userId, messageId, occurredAt, status: 'processing' };
 */
export type WorkerQuestionUpdate = Readonly<{
  questionId: string;
  userId: string;
  messageId: string;
  occurredAt: Date;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  answer?: string;
  errorCode?: string;
}>;

/**
 * Expose focused question persistence operations to application services.
 *
 * @example
 * const repository = createQuestionRepository(mongo.questions);
 */
export type QuestionRepository = Readonly<{
  createQuestion: (input: CreateQuestionRecord) => Promise<QuestionDto>;
  findQuestionForUser: (questionId: string, userId: string) => Promise<QuestionDto | null>;
  markDispatchFailed: (questionId: string, userId: string) => Promise<void>;
  markCancelledByUser: (questionId: string, userId: string) => Promise<QuestionDto | null>;
  applyWorkerUpdate: (input: WorkerQuestionUpdate) => Promise<void>;
}>;

/**
 * Map a persistence record to a client-safe JSON DTO.
 *
 * @param question - Server-owned persistence record.
 * @returns Public question data with ISO timestamps and no owner identifier.
 * @example
 * const dto = toQuestionDto(question);
 */
const toQuestionDto = (question: QuestionDocument): QuestionDto => ({
  id: question.id,
  content: question.content,
  status: question.status,
  answer: question.answer,
  errorCode: question.errorCode,
  createdAt: question.createdAt.toISOString(),
  updatedAt: question.updatedAt.toISOString(),
});

/**
 * Return source statuses from which a worker event may transition safely.
 *
 * @param status - Terminal or in-progress worker-authored target status.
 * @returns Allowed current states that protect cancellation and terminal results.
 * @example
 * const statuses = getAllowedSourceStatuses('completed');
 */
const getAllowedSourceStatuses = (
  status: WorkerQuestionUpdate['status'],
): readonly QuestionDocument['status'][] => {
  if (status === QUESTION_STATUSES.processing) return [QUESTION_STATUSES.queued];
  if (status === QUESTION_STATUSES.cancelled) {
    return [
      QUESTION_STATUSES.queued,
      QUESTION_STATUSES.processing,
      QUESTION_STATUSES.cancellationRequested,
    ];
  }

  return [QUESTION_STATUSES.queued, QUESTION_STATUSES.processing];
};

/**
 * Ensure indexes supporting stable identifiers and owner-scoped polling.
 *
 * @param questions - Typed server-owned questions collection.
 * @returns A promise that resolves after indexes exist.
 * @example
 * await ensureQuestionIndexes(mongo.questions);
 */
export const ensureQuestionIndexes = async (
  questions: Collection<QuestionDocument>,
): Promise<void> => {
  await questions.createIndexes([
    { key: { id: 1 }, unique: true, name: 'uq_questions_id' },
    { key: { userId: 1, updatedAt: -1 }, name: 'ix_questions_user_updated_at' },
  ]);
};

/**
 * Build question persistence over the official MongoDB driver.
 *
 * @param questions - Typed collection created once during server bootstrap.
 * @returns Owner-scoped creation, polling, cancellation, and event updates.
 * @example
 * const repository = createQuestionRepository(mongo.questions);
 */
export const createQuestionRepository = (
  questions: Collection<QuestionDocument>,
): QuestionRepository => {
  /**
   * Persist one question with server-controlled initial state.
   *
   * @param input - Authenticated owner and validated question content.
   * @returns The queued client-safe question.
   * @example
   * const question = await createQuestion({ userId, content });
   */
  const createQuestion = async (input: CreateQuestionRecord): Promise<QuestionDto> => {
    const now = new Date();
    const question: QuestionDocument = {
      id: randomUUID(),
      userId: input.userId,
      content: input.content,
      status: QUESTION_STATUSES.queued,
      answer: null,
      errorCode: null,
      lastWorkerMessageId: null,
      createdAt: now,
      updatedAt: now,
    };

    await questions.insertOne(question);
    return toQuestionDto(question);
  };

  /**
   * Load one question only when it belongs to the requesting user.
   *
   * @param questionId - Stable public question identifier.
   * @param userId - Authenticated owner identifier.
   * @returns The matching question or null without revealing another owner.
   * @example
   * const question = await findQuestionForUser(questionId, userId);
   */
  const findQuestionForUser = async (
    questionId: string,
    userId: string,
  ): Promise<QuestionDto | null> => {
    const question = await questions.findOne({ id: questionId, userId });
    return question === null ? null : toQuestionDto(question);
  };

  /**
   * Mark a queued question failed when its command cannot reach RabbitMQ.
   *
   * @param questionId - Stable public question identifier.
   * @param userId - Authenticated owner identifier.
   * @returns A promise resolving after the guarded update.
   * @example
   * await markDispatchFailed(questionId, userId);
   */
  const markDispatchFailed = async (questionId: string, userId: string): Promise<void> => {
    await questions.updateOne(
      { id: questionId, userId, status: QUESTION_STATUSES.queued },
      {
        $set: {
          status: QUESTION_STATUSES.failed,
          errorCode: 'QUESTION_DISPATCH_FAILED',
          updatedAt: new Date(),
        },
      },
    );
  };

  /**
   * Atomically mark an active question cancelled after its broadcast is confirmed.
   *
   * The terminal server state prevents a lost or late worker event from leaving
   * polling stuck when no worker was online to observe the broadcast.
   *
   * @param questionId - Stable public question identifier.
   * @param userId - Authenticated owner identifier.
   * @returns The cancelled question, latest terminal question, or null when missing.
   * @example
   * const question = await markCancelledByUser(questionId, userId);
   */
  const markCancelledByUser = async (
    questionId: string,
    userId: string,
  ): Promise<QuestionDto | null> => {
    const question = await questions.findOneAndUpdate(
      {
        id: questionId,
        userId,
        status: { $in: [QUESTION_STATUSES.queued, QUESTION_STATUSES.processing] },
      },
      {
        $set: {
          status: QUESTION_STATUSES.cancelled,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    );

    return question === null ? findQuestionForUser(questionId, userId) : toQuestionDto(question);
  };

  /**
   * Apply an idempotent worker update without overwriting terminal or cancelled state.
   *
   * @param input - Validated worker transition and message metadata.
   * @returns A promise resolving after the guarded update.
   * @example
   * await applyWorkerUpdate(update);
   */
  const applyWorkerUpdate = async (input: WorkerQuestionUpdate): Promise<void> => {
    const filter: Filter<QuestionDocument> = {
      id: input.questionId,
      userId: input.userId,
      status: { $in: getAllowedSourceStatuses(input.status) },
      lastWorkerMessageId: { $ne: input.messageId },
    };
    const update: UpdateFilter<QuestionDocument> = {
      $set: {
        status: input.status,
        answer: input.status === QUESTION_STATUSES.completed ? (input.answer ?? null) : null,
        errorCode:
          input.status === QUESTION_STATUSES.failed ? (input.errorCode ?? 'AI_FAILED') : null,
        lastWorkerMessageId: input.messageId,
        updatedAt: input.occurredAt,
      },
    };

    await questions.updateOne(filter, update);
  };

  return {
    createQuestion,
    findQuestionForUser,
    markDispatchFailed,
    markCancelledByUser,
    applyWorkerUpdate,
  };
};
