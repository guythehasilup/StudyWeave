import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { questionQueryKeys } from '../api/question-query-keys';
import { cancelQuestion } from '../api/questions-api';
import type { QuestionApiError } from '../api/questions-api';
import type { QuestionDto } from '../questions.types';

/**
 * Request cancellation and synchronize the selected question cache.
 *
 * @returns TanStack Query mutation state accepting a question identifier.
 * @example
 * const cancelMutation = useCancelQuestionMutation();
 */
export const useCancelQuestionMutation = (): UseMutationResult<
  QuestionDto,
  QuestionApiError,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelQuestion,
    onSuccess: (question) => {
      queryClient.setQueryData(questionQueryKeys.detail(question.id), question);
    },
  });
};
