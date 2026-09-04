import { Alert, Button, CircularProgress, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { ReactElement } from 'react';
import { NavigationLink } from '../../../app/router/NavigationLink';
import { DEFAULT_PROTECTED_ROUTE_PATH, ROUTE_PATHS } from '../../../app/router/route-paths';
import { useRouter } from '../../../app/router/useRouter';
import type { ResourceKey } from '../../../shared/localization/resources';
import { useTranslate } from '../../../shared/localization/useTranslate';
import { AuthLayout } from '../../../shared/ui/AuthLayout';
import { SwForm } from '../../../shared/ui/SwForm';
import { SwTextField } from '../../../shared/ui/SwTextField';
import {
  normalizeUsername,
  validateDisplayName,
  validatePassword,
  validateUsername,
} from '../auth-validation';
import type { RegisterFormValues } from '../auth.types';
import { PasswordField } from '../components/PasswordField';
import { useRegisterMutation } from '../hooks/useRegisterMutation';

const REGISTER_DEFAULT_VALUES: RegisterFormValues = {
  displayName: '',
  username: '',
  password: '',
};

/**
 * Render the localized registration form with validation and request states.
 *
 * @returns The responsive account-creation page.
 * @example
 * <RegisterPage />
 */
export const RegisterPage = (): ReactElement => {
  const { translate } = useTranslate();
  const { navigate } = useRouter();
  const registerMutation = useRegisterMutation();
  const form = useForm<RegisterFormValues>({
    defaultValues: REGISTER_DEFAULT_VALUES,
    mode: 'onBlur',
  });
  /**
   * Normalize validated values and execute the registration mutation once.
   *
   * @param values - React Hook Form values that passed client validation.
   * @returns A promise that settles after success handling or focus restoration.
   * @example
   * await handleSubmit({ username: 'student', password: 'secure-passphrase', displayName: 'Student' });
   */
  const handleSubmit = async (values: RegisterFormValues): Promise<void> => {
    try {
      await registerMutation.mutateAsync({
        username: normalizeUsername(values.username),
        password: values.password,
        displayName: values.displayName.trim(),
      });
      form.reset(REGISTER_DEFAULT_VALUES);
      navigate(DEFAULT_PROTECTED_ROUTE_PATH, { replace: true });
    } catch {
      form.setFocus('username');
    }
  };

  return (
    <AuthLayout
      title={translate('register.heading')}
      description={translate('register.description')}
      footer={
        <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
          {translate('register.links.hasAccount')}{' '}
          <NavigationLink to={ROUTE_PATHS.login}>
            {translate('register.links.login')}
          </NavigationLink>
        </Typography>
      }
    >
      <SwForm form={form} onSubmit={handleSubmit}>
        <Controller
          control={form.control}
          name="displayName"
          rules={{ validate: validateDisplayName }}
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message as ResourceKey | undefined;

            return (
              <SwTextField
                name={field.name}
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  registerMutation.reset();
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
                label={translate('register.fields.displayName')}
                autoComplete="name"
                error={errorMessage !== undefined}
                helperText={errorMessage === undefined ? undefined : translate(errorMessage)}
                disabled={registerMutation.isPending}
                required
              />
            );
          }}
        />
        <Controller
          control={form.control}
          name="username"
          rules={{ validate: validateUsername }}
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message as ResourceKey | undefined;

            return (
              <SwTextField
                name={field.name}
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  registerMutation.reset();
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
                label={translate('register.fields.username')}
                autoComplete="username"
                error={errorMessage !== undefined}
                helperText={errorMessage === undefined ? undefined : translate(errorMessage)}
                disabled={registerMutation.isPending}
                required
              />
            );
          }}
        />
        <Controller
          control={form.control}
          name="password"
          rules={{ validate: validatePassword }}
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message as ResourceKey | undefined;

            return (
              <PasswordField
                label={translate('register.fields.password')}
                autoComplete="new-password"
                name={field.name}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  registerMutation.reset();
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
                errorMessage={errorMessage === undefined ? undefined : translate(errorMessage)}
                isDisabled={registerMutation.isPending}
              />
            );
          }}
        />

        {registerMutation.isError ? (
          <Alert severity="error" variant="outlined">
            {translate(registerMutation.error.resourceKey)}
          </Alert>
        ) : null}
        {registerMutation.isSuccess ? (
          <Alert severity="success" variant="outlined" role="status">
            {translate('register.status.success')}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={registerMutation.isPending}
          startIcon={
            registerMutation.isPending ? <CircularProgress color="inherit" size={18} /> : undefined
          }
        >
          {translate(registerMutation.isPending ? 'register.status.submitting' : 'register.submit')}
        </Button>
      </SwForm>
    </AuthLayout>
  );
};
