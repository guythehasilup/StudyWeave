import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { questionQueryKeys } from '../api/question-query-keys';
import { createQuestion } from '../api/questions-api';
import type { QuestionApiError } from '../api/questions-api';
import type { CreateQuestionInput, QuestionDto } from '../questions.types';

/**
 * Submit a question and seed its authoritative polling cache entry.
 *
 * @returns TanStack Query mutation state and submission action.
 * @example
 * const createMutation = useCreateQuestionMutation();
 */
export const useCreateQuestionMutation = (): UseMutationResult<
  QuestionDto,
  QuestionApiError,
  CreateQuestionInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuestion,
    onSuccess: (question) => {
      queryClient.setQueryData(questionQueryKeys.detail(question.id), question);
    },
  });
};
