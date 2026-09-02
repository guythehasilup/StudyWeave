import { Stack } from '@mui/material';
import type { StackProps } from '@mui/material';
import type { ReactElement } from 'react';
import { FormProvider } from 'react-hook-form';
import type {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';

/**
 * Configure the shared React Hook Form and MUI form boundary.
 *
 * All MUI `Stack` layout and system props remain available, including `sx`,
 * responsive `spacing` and `direction`, `divider`, `className`, and native form attributes.
 *
 * @property form - React Hook Form methods that own the form state.
 * @property onSubmit - Handle values after successful validation.
 * @property onInvalid - Handle validation errors. Defaults to React Hook Form behavior.
 * @property noValidate - Disable browser validation in favor of React Hook Form. Defaults to `true`.
 * @property spacing - Space between immediate form children. Defaults to `2`.
 * @example
 * <SwForm form={form} onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
 *   {fields}
 * </SwForm>
 */
export type SwFormProps<
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
> = Readonly<
  Omit<StackProps<'form'>, 'component' | 'onSubmit'> & {
    form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
    onSubmit: SubmitHandler<TTransformedValues>;
    onInvalid?: SubmitErrorHandler<TFieldValues>;
  }
>;

/**
 * Render an extensible MUI form backed by React Hook Form context.
 *
 * @param props - Form methods, typed submission handlers, children, and optional MUI Stack props.
 * @param props.noValidate - Disable native browser validation. Defaults to `true`.
 * @param props.spacing - Form child spacing. Defaults to `2`.
 * @returns A semantic form whose descendants can consume React Hook Form context.
 * @example
 * <SwForm form={form} onSubmit={handleSubmit} spacing={{ xs: 2, md: 3 }}>
 *   <AccountFields />
 * </SwForm>
 */
export const SwForm = <
  TFieldValues extends FieldValues,
  TContext = unknown,
  TTransformedValues = TFieldValues,
>({
  form,
  onSubmit,
  onInvalid,
  children,
  noValidate = true,
  spacing = 2,
  ...stackProps
}: SwFormProps<TFieldValues, TContext, TTransformedValues>): ReactElement => (
  <FormProvider {...form}>
    <Stack
      {...stackProps}
      component="form"
      noValidate={noValidate}
      spacing={spacing}
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {children}
    </Stack>
  </FormProvider>
);
