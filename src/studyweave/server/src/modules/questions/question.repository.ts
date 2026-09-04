import { randomUUID } from 'node:crypto';
import { QUESTION_STATUSES } from '@studyweave/swwai-contract';
import type { QuestionContent, QuestionDto, QuestionResponseDto } from '@studyweave/swwai-contract';
import type { Collection, Filter, UpdateFilter } from 'mongodb';
import type { QuestionDocument } from './question.document.js';
import type { QuestionResponseDocument } from './question-response.document.js';

/**
 * Values required to persist a new queued question.
 *
 * @example
 * const input: CreateQuestionRecord = { userId, content };
 */
export interface CreateQuestionRecord {
  readonly userId: string;
  readonly content: QuestionContent;
}

/** Shared identity and ordering metadata for a worker-authored transition. */
interface WorkerQuestionUpdateBase {
  readonly questionId: string;
  readonly userId: string;
  readonly messageId: string;
  readonly occurredAt: Date;
}

/** Worker transition that does not create an AI response. */
interface WorkerQuestionStatusUpdate extends WorkerQuestionUpdateBase {
  readonly status: 'processing' | 'cancelled';
}

/** Worker transition carrying a completed AI response. */
interface WorkerQuestionCompletedUpdate extends WorkerQuestionUpdateBase {
  readonly status: 'completed';
  readonly answer: string;
  readonly providerResponseId: string | null;
}

/** Worker transition carrying a stable AI failure response. */
interface WorkerQuestionFailedUpdate extends WorkerQuestionUpdateBase {
  readonly status: 'failed';
  readonly errorCode: string;
}

/**
 * Values required to apply one worker-authored status or response transition.
 *
 * @example
 * const update: WorkerQuestionUpdate = {
 *   questionId,
 *   userId,
 *   messageId,
 *   occurredAt,
 *   status: 'processing',
 * };
 */
export type WorkerQuestionUpdate =
  WorkerQuestionStatusUpdate | WorkerQuestionCompletedUpdate | WorkerQuestionFailedUpdate;

/**
 * Expose focused question and response persistence operations.
 *
 * @example
 * const repository = createQuestionRepository(mongo.questions, mongo.responses);
 */
export interface QuestionRepository {
  readonly createQuestion: (input: CreateQuestionRecord) => Promise<QuestionDto>;
  readonly findQuestionForUser: (questionId: string, userId: string) => Promise<QuestionDto | null>;
  readonly markDispatchFailed: (questionId: string, userId: string) => Promise<void>;
  readonly markCancelledByUser: (questionId: string, userId: string) => Promise<QuestionDto | null>;
  readonly applyWorkerUpdate: (input: WorkerQuestionUpdate) => Promise<void>;
}

/**
 * Map an immutable response document to a client-safe nested DTO.
 *
 * @param response - Server-owned response persistence record.
 * @returns AI outcome data without persistence-only relationship details.
 * @example
 * const dto = toQuestionResponseDto(response);
 */
const toQuestionResponseDto = (response: QuestionResponseDocument): QuestionResponseDto =>
  response.answer === null
    ? {
        id: response.id,
        answer: null,
        errorCode: response.errorCode,
        providerResponseId: null,
        createdAt: response.createdAt.toISOString(),
      }
    : {
        id: response.id,
        answer: response.answer,
        errorCode: null,
        providerResponseId: response.providerResponseId,
        createdAt: response.createdAt.toISOString(),
      };

/**
 * Map a question and its optional response to a client-safe aggregate DTO.
 *
 * @param question - Owner-authorized question persistence record.
 * @param response - Referenced response, or null before a terminal AI outcome.
 * @returns Public question data with ISO timestamps and no owner identifier.
 * @example
 * const dto = toQuestionDto(question, response);
 */
const toQuestionDto = (
  question: QuestionDocument,
  response: QuestionResponseDocument | null,
): QuestionDto => {
  const metadata = {
    id: question.id,
    content: question.content,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  } as const;

  if (question.status === QUESTION_STATUSES.completed) {
    if (response === null || response.answer === null) {
      throw new Error('QUESTION_COMPLETED_RESPONSE_MISSING');
    }
    const responseDto = toQuestionResponseDto(response);
    if (responseDto.answer === null) throw new Error('QUESTION_COMPLETED_RESPONSE_INVALID');
    return { ...metadata, status: question.status, response: responseDto };
  }

  if (question.status === QUESTION_STATUSES.failed) {
    if (response === null || response.answer !== null) {
      throw new Error('QUESTION_FAILED_RESPONSE_MISSING');
    }
    const responseDto = toQuestionResponseDto(response);
    if (responseDto.answer !== null) throw new Error('QUESTION_FAILED_RESPONSE_INVALID');
    return { ...metadata, status: question.status, response: responseDto };
  }

  return { ...metadata, status: question.status, response: null };
};

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
 * Build the immutable response represented by a terminal worker update.
 *
 * @param input - Validated worker transition.
 * @returns A response keyed by the stable worker message ID, or null for status-only events.
 * @example
 * const response = createWorkerResponse(update);
 */
const createWorkerResponse = (input: WorkerQuestionUpdate): QuestionResponseDocument | null => {
  if (input.status === QUESTION_STATUSES.completed) {
    return {
      id: input.messageId,
      answer: input.answer,
      errorCode: null,
      providerResponseId: input.providerResponseId,
      createdAt: input.occurredAt,
    };
  }

  if (input.status === QUESTION_STATUSES.failed) {
    return {
      id: input.messageId,
      answer: null,
      errorCode: input.errorCode,
      providerResponseId: null,
      createdAt: input.occurredAt,
    };
  }

  return null;
};

/**
 * Ensure indexes supporting owner-scoped questions and referenced responses.
 *
 * @param questions - Typed server-owned questions collection.
 * @param responses - Typed server-owned responses collection.
 * @returns A promise that resolves after both collection indexes exist.
 * @example
 * await ensureQuestionIndexes(mongo.questions, mongo.responses);
 */
export const ensureQuestionIndexes = async (
  questions: Collection<QuestionDocument>,
  responses: Collection<QuestionResponseDocument>,
): Promise<void> => {
  await Promise.all([
    questions.createIndexes([
      { key: { id: 1 }, unique: true, name: 'uq_questions_id' },
      { key: { userId: 1, updatedAt: -1 }, name: 'ix_questions_user_updated_at' },
    ]),
    responses.createIndex({ id: 1 }, { unique: true, name: 'uq_responses_id' }),
  ]);
};

/**
 * Build question persistence over the official MongoDB driver.
 *
 * Questions contain the owner relationship and a response reference. Responses
 * remain owner-agnostic and can only be loaded after the question is authorized.
 *
 * @param questions - Typed questions collection created once during bootstrap.
 * @param responses - Typed responses collection created once during bootstrap.
 * @returns Owner-scoped creation, polling, cancellation, and event updates.
 * @example
 * const repository = createQuestionRepository(mongo.questions, mongo.responses);
 */
export const createQuestionRepository = (
  questions: Collection<QuestionDocument>,
  responses: Collection<QuestionResponseDocument>,
): QuestionRepository => {
  /**
   * Load a response through its question-owned reference.
   *
   * @param responseId - Referenced response identifier, or null before a response exists.
   * @returns The referenced response, or null when no response is associated.
   * @example
   * const response = await findResponse(question.responseId);
   */
  const findResponse = async (
    responseId: string | null,
  ): Promise<QuestionResponseDocument | null> =>
    responseId === null ? null : responses.findOne({ id: responseId });

  /**
   * Persist an immutable response exactly once.
   *
   * @param response - Complete server-owned response document.
   * @returns A promise resolving after the idempotent upsert.
   * @example
   * await persistResponse(response);
   */
  const persistResponse = async (response: QuestionResponseDocument): Promise<void> => {
    await responses.updateOne({ id: response.id }, { $setOnInsert: response }, { upsert: true });
  };

  /**
   * Remove an unreferenced response produced by a transition that lost a race.
   *
   * Successful redelivery keeps a response already referenced by the question.
   *
   * @param questionId - Target question identifier.
   * @param userId - Authenticated or message-carried owner identifier.
   * @param responseId - Candidate response identifier.
   * @returns A promise resolving after reference verification and optional cleanup.
   * @example
   * await removeResponseUnlessReferenced(questionId, userId, responseId);
   */
  const removeResponseUnlessReferenced = async (
    questionId: string,
    userId: string,
    responseId: string,
  ): Promise<void> => {
    const referencingQuestion = await questions.findOne({
      id: questionId,
      userId,
      responseId,
    });
    if (referencingQuestion === null) await responses.deleteOne({ id: responseId });
  };

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
      responseId: null,
      lastWorkerMessageId: null,
      createdAt: now,
      updatedAt: now,
    };

    await questions.insertOne(question);
    return toQuestionDto(question, null);
  };

  /**
   * Load one question and then its response only when ownership matches.
   *
   * @param questionId - Stable public question identifier.
   * @param userId - Authenticated owner identifier.
   * @returns The matching question aggregate or null without revealing another owner.
   * @example
   * const question = await findQuestionForUser(questionId, userId);
   */
  const findQuestionForUser = async (
    questionId: string,
    userId: string,
  ): Promise<QuestionDto | null> => {
    const question = await questions.findOne({ id: questionId, userId });
    if (question === null) return null;

    const response = await findResponse(question.responseId);
    return toQuestionDto(question, response);
  };

  /**
   * Mark a queued question failed when its command cannot reach RabbitMQ.
   *
   * @param questionId - Stable public question identifier.
   * @param userId - Authenticated owner identifier.
   * @returns A promise resolving after the guarded response and status update.
   * @example
   * await markDispatchFailed(questionId, userId);
   */
  const markDispatchFailed = async (questionId: string, userId: string): Promise<void> => {
    const now = new Date();
    const response: QuestionResponseDocument = {
      id: randomUUID(),
      answer: null,
      errorCode: 'QUESTION_DISPATCH_FAILED',
      providerResponseId: null,
      createdAt: now,
    };
    await persistResponse(response);
    const result = await questions.updateOne(
      { id: questionId, userId, status: QUESTION_STATUSES.queued },
      {
        $set: {
          status: QUESTION_STATUSES.failed,
          responseId: response.id,
          updatedAt: now,
        },
      },
    );

    if (result.modifiedCount === 0) {
      await removeResponseUnlessReferenced(questionId, userId, response.id);
    }
  };

  /**
   * Atomically mark an active question cancelled after its broadcast is confirmed.
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

    if (question === null) return findQuestionForUser(questionId, userId);
    const response = await findResponse(question.responseId);
    return toQuestionDto(question, response);
  };

  /**
   * Apply an idempotent worker update without overwriting terminal or cancelled state.
   *
   * Terminal updates persist their immutable response before linking it from the
   * guarded question update. A losing transition removes its unreferenced response.
   *
   * @param input - Validated worker transition and message metadata.
   * @returns A promise resolving after the guarded update and any cleanup.
   * @example
   * await applyWorkerUpdate(update);
   */
  const applyWorkerUpdate = async (input: WorkerQuestionUpdate): Promise<void> => {
    const response = createWorkerResponse(input);
    if (response !== null) await persistResponse(response);

    const filter: Filter<QuestionDocument> = {
      id: input.questionId,
      userId: input.userId,
      status: { $in: getAllowedSourceStatuses(input.status) },
      lastWorkerMessageId: { $ne: input.messageId },
    };
    const update: UpdateFilter<QuestionDocument> = {
      $set: {
        status: input.status,
        ...(response === null ? {} : { responseId: response.id }),
        lastWorkerMessageId: input.messageId,
        updatedAt: input.occurredAt,
      },
    };
    const result = await questions.updateOne(filter, update);

    if (response !== null && result.modifiedCount === 0) {
      await removeResponseUnlessReferenced(input.questionId, input.userId, response.id);
    }
  };

  return {
    createQuestion,
    findQuestionForUser,
    markDispatchFailed,
    markCancelledByUser,
    applyWorkerUpdate,
  };
};
