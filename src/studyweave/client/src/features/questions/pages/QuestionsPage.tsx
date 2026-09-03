import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslate } from '../../../shared/localization/useTranslate';
import type { ResourceKey } from '../../../shared/localization/resources';
import { SwForm } from '../../../shared/ui/SwForm';
import { useCancelQuestionMutation } from '../hooks/useCancelQuestionMutation';
import { useCreateQuestionMutation } from '../hooks/useCreateQuestionMutation';
import { useQuestion } from '../hooks/useQuestion';
import { isActiveQuestionStatus } from '../questions.types';
import type { QuestionFormValues, QuestionStatus } from '../questions.types';

const QUESTION_DEFAULT_VALUES: QuestionFormValues = { questionText: '' };
const QUESTION_STATUS_KEYS: Readonly<Record<QuestionStatus, ResourceKey>> = {
  queued: 'questions.status.queued',
  processing: 'questions.status.processing',
  cancellation_requested: 'questions.status.cancellationRequested',
  completed: 'questions.status.completed',
  failed: 'questions.status.failed',
  cancelled: 'questions.status.cancelled',
};

/**
 * Validate the text accepted by the current question POC.
 *
 * @param value - Editable question text.
 * @returns True when valid, otherwise a localized validation resource key.
 * @example
 * const result = validateQuestionText('Explain inertia.');
 */
const validateQuestionText = (value: string): true | ResourceKey => {
  const length = value.trim().length;
  if (length === 0) return 'validation.errors.questionRequired';
  return length <= 20_000 ? true : 'validation.errors.questionLength';
};

/**
 * Render the authenticated question submission, polling, result, and stop flow.
 *
 * @returns A responsive localized MUI question page.
 * @example
 * <QuestionsPage />
 */
export const QuestionsPage = (): ReactElement => {
  const { translate } = useTranslate();
  const [questionId, setQuestionId] = useState<string | null>(null);
  const createMutation = useCreateQuestionMutation();
  const cancelMutation = useCancelQuestionMutation();
  const questionQuery = useQuestion(questionId);
  const form = useForm<QuestionFormValues>({
    defaultValues: QUESTION_DEFAULT_VALUES,
    mode: 'onBlur',
  });
  const question = questionQuery.data ?? createMutation.data ?? null;
  const isActive = question !== null && isActiveQuestionStatus(question.status);
  const isStopping = cancelMutation.isPending || question?.status === 'cancellation_requested';
  const requestError = createMutation.error ?? cancelMutation.error ?? questionQuery.error;

  /**
   * Submit normalized text and begin polling the accepted question.
   *
   * @param values - React Hook Form values that passed validation.
   * @returns A promise settling after the server accepts or rejects the command.
   * @example
   * await handleSubmit({ questionText: 'What is inertia?' });
   */
  const handleSubmit = async (values: QuestionFormValues): Promise<void> => {
    if (isActive) return;
    createMutation.reset();
    cancelMutation.reset();

    try {
      const createdQuestion = await createMutation.mutateAsync({
        content: {
          parts: [{ type: 'text', text: values.questionText.trim() }],
        },
      });
      setQuestionId(createdQuestion.id);
    } catch {
      form.setFocus('questionText');
    }
  };

  /**
   * Request best-effort cancellation for the selected active question.
   *
   * @returns A promise settling after the server accepts or rejects cancellation.
   * @example
   * await handleStop();
   */
  const handleStop = async (): Promise<void> => {
    if (questionId === null || !isActive || isStopping) return;
    cancelMutation.reset();

    try {
      await cancelMutation.mutateAsync(questionId);
    } catch {
      form.setFocus('questionText');
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 3, sm: 6 } }}>
      <Stack spacing={3}>
        <Stack component="header" spacing={1}>
          <Typography component="h1" variant="h1">
            {translate('questions.heading')}
          </Typography>
          <Typography color="text.secondary">{translate('questions.description')}</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider' }}>
          <SwForm form={form} onSubmit={handleSubmit}>
            <Controller
              control={form.control}
              name="questionText"
              rules={{ validate: validateQuestionText }}
              render={({ field, fieldState }) => {
                const errorKey = fieldState.error?.message as ResourceKey | undefined;

                return (
                  <TextField
                    {...field}
                    onChange={(event) => {
                      field.onChange(event);
                      createMutation.reset();
                    }}
                    label={translate('questions.fields.question')}
                    placeholder={translate('questions.fields.placeholder')}
                    error={errorKey !== undefined}
                    helperText={errorKey === undefined ? undefined : translate(errorKey)}
                    disabled={isActive}
                    minRows={5}
                    multiline
                    required
                    fullWidth
                  />
                );
              }}
            />

            <Button
              type={isActive ? 'button' : 'submit'}
              variant="contained"
              color={isActive ? 'error' : 'primary'}
              disabled={createMutation.isPending || isStopping}
              onClick={isActive ? () => void handleStop() : undefined}
              startIcon={
                createMutation.isPending || isStopping ? (
                  <CircularProgress color="inherit" size={18} />
                ) : undefined
              }
            >
              {translate(
                isStopping
                  ? 'questions.actions.stopping'
                  : isActive
                    ? 'questions.actions.stop'
                    : createMutation.isPending
                      ? 'questions.actions.sending'
                      : 'questions.actions.send',
              )}
            </Button>
          </SwForm>
        </Paper>

        {requestError !== null ? (
          <Alert severity="error" variant="outlined">
            {translate(requestError.resourceKey)}
          </Alert>
        ) : null}

        {question !== null ? (
          <Paper
            component="section"
            aria-live="polite"
            elevation={0}
            sx={{ p: { xs: 2, sm: 3 }, border: 1, borderColor: 'divider' }}
          >
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {translate(QUESTION_STATUS_KEYS[question.status])}
              </Typography>

              {question.status === 'completed' && question.answer !== null ? (
                <>
                  <Typography component="h2" variant="h6">
                    {translate('questions.answerHeading')}
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{question.answer}</Typography>
                </>
              ) : null}

              {question.status === 'failed' ? (
                <Alert severity="error" variant="outlined">
                  {translate('questions.errors.answerFailed')}
                </Alert>
              ) : null}

              {question.status === 'cancelled' ? (
                <Alert severity="info" variant="outlined">
                  {translate('questions.status.cancelled')}
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
};
