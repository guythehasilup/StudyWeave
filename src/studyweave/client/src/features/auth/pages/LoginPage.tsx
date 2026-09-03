import { Alert, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { ResourceKey } from '../../../shared/localization/resources';
import { useTranslate } from '../../../shared/localization/useTranslate';
import { AuthLayout } from '../../../shared/ui/AuthLayout';
import { SwForm } from '../../../shared/ui/SwForm';
import { NavigationLink } from '../../../app/router/NavigationLink';
import { DEFAULT_PROTECTED_ROUTE_PATH, ROUTE_PATHS } from '../../../app/router/route-paths';
import { useRouter } from '../../../app/router/useRouter';
import { normalizeUsername, validatePassword, validateUsername } from '../auth-validation';
import type { LoginFormValues } from '../auth.types';
import { PasswordField } from '../components/PasswordField';
import { useLoginMutation } from '../hooks/useLoginMutation';

const LOGIN_DEFAULT_VALUES: LoginFormValues = { username: '', password: '' };

/**
 * Render the localized login form with explicit validation and request states.
 *
 * @returns The responsive authentication page.
 * @example
 * <LoginPage />
 */
export const LoginPage = (): ReactElement => {
  const { translate } = useTranslate();
  const { navigate } = useRouter();
  const loginMutation = useLoginMutation();
  const form = useForm<LoginFormValues>({
    defaultValues: LOGIN_DEFAULT_VALUES,
    mode: 'onBlur',
  });
  /**
   * Normalize validated values and execute the login mutation once.
   *
   * @param values - React Hook Form values that passed client validation.
   * @returns A promise that settles after success handling or focus restoration.
   * @example
   * await handleSubmit({ username: 'student', password: 'secure-passphrase' });
   */
  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    loginMutation.reset();

    try {
      await loginMutation.mutateAsync({
        username: normalizeUsername(values.username),
        password: values.password,
      });
      form.reset(LOGIN_DEFAULT_VALUES);
      navigate(DEFAULT_PROTECTED_ROUTE_PATH, { replace: true });
    } catch {
      form.setFocus('username');
    }
  };

  return (
    <AuthLayout
      title={translate('login.heading')}
      description={translate('login.description')}
      footer={
        <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
          {translate('login.links.noAccount')}{' '}
          <NavigationLink to={ROUTE_PATHS.register}>
            {translate('login.links.register')}
          </NavigationLink>
        </Typography>
      }
    >
      <SwForm form={form} onSubmit={handleSubmit}>
        <Controller
          control={form.control}
          name="username"
          rules={{ validate: validateUsername }}
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message as ResourceKey | undefined;

            return (
              <TextField
                name={field.name}
                value={field.value}
                onChange={(event) => {
                  field.onChange(event);
                  loginMutation.reset();
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
                label={translate('login.fields.username')}
                autoComplete="username"
                error={errorMessage !== undefined}
                helperText={errorMessage === undefined ? undefined : translate(errorMessage)}
                disabled={loginMutation.isPending}
                required
                fullWidth
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
                label={translate('login.fields.password')}
                autoComplete="current-password"
                name={field.name}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  loginMutation.reset();
                }}
                onBlur={field.onBlur}
                inputRef={field.ref}
                errorMessage={errorMessage === undefined ? undefined : translate(errorMessage)}
                isDisabled={loginMutation.isPending}
              />
            );
          }}
        />

        {loginMutation.isError ? (
          <Alert severity="error" variant="outlined">
            {translate(loginMutation.error.resourceKey)}
          </Alert>
        ) : null}
        {loginMutation.isSuccess ? (
          <Alert severity="success" variant="outlined" role="status">
            {translate('login.status.success')}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loginMutation.isPending}
          startIcon={
            loginMutation.isPending ? <CircularProgress color="inherit" size={18} /> : undefined
          }
        >
          {translate(loginMutation.isPending ? 'login.status.submitting' : 'login.submit')}
        </Button>
      </SwForm>
    </AuthLayout>
  );
};
