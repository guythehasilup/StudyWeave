import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { getQuestion } from '../api/questions-api';
import type { QuestionApiError } from '../api/questions-api';
import { questionQueryKeys } from '../api/question-query-keys';
import { isActiveQuestionStatus } from '../questions.types';
import type { QuestionDto } from '../questions.types';

/**
 * Poll one question while the worker can still change its status.
 *
 * @param questionId - Selected public question ID. Null disables the query.
 * @returns TanStack Query state that stops polling at a terminal status.
 * @example
 * const questionQuery = useQuestion(questionId);
 */
export const useQuestion = (
  questionId: string | null,
): UseQueryResult<QuestionDto, QuestionApiError> =>
  useQuery({
    queryKey: questionQueryKeys.detail(questionId ?? ''),
    queryFn: ({ signal }) => getQuestion(questionId ?? '', signal),
    enabled: questionId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status !== undefined && isActiveQuestionStatus(status) ? 1_000 : false;
    },
  });
