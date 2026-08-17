import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AuthLayout } from '../../common/components/AuthLayout.component';
import { he } from '../../common/resources/he.resource';
import { NavigationLink } from '../../common/routing/components/NavigationLink.component';
import { FormField } from '../components/FormField.component';
import { useAuthForm } from '../hooks/useAuthForm.hook';
import { normalizeUsername } from '../services/username.service';
import {
  validateCredentials,
  validatePassword,
  validateUsername,
} from '../validators/credentials.validator';
import { login } from './services/login.service';

export const LoginPage = () => {
  const { loginForm, updateLoginForm, clearLoginForm } = useAuthForm();
  const { username, password } = loginForm;
  const [touched, setTouched] = useState({ username: false, password: false });
  const [requestError, setRequestError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const errors = {
    username: touched.username ? validateUsername(username) : undefined,
    password: touched.password ? validatePassword(password) : undefined,
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateCredentials(username, password);

    setTouched({ username: true, password: true });
    setRequestError(undefined);
    setSuccessMessage(undefined);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: normalizeUsername(username), password });
      clearLoginForm();
      setTouched({ username: false, password: false });
      setSuccessMessage(he.login.success);
    } catch {
      setRequestError(he.login.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={he.login.heading}
      description={he.login.description}
      footer={
        <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
          {he.login.noAccount}{' '}
          <NavigationLink to="/register">{he.login.registerLink}</NavigationLink>
        </Typography>
      }
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <FormField
          id="username"
          label={he.login.usernameLabel}
          type="text"
          value={username}
          autoComplete="username"
          onChange={(event) => {
            updateLoginForm({ username: event.target.value });
            setTouched((current) => ({ ...current, username: true }));
            setRequestError(undefined);
          }}
          error={errors.username}
          disabled={isLoading}
        />
        <FormField
          id="password"
          label={he.login.passwordLabel}
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => {
            updateLoginForm({ password: event.target.value });
            setTouched((current) => ({ ...current, password: true }));
            setRequestError(undefined);
          }}
          error={errors.password}
          disabled={isLoading}
        />

        {requestError ? (
          <Alert severity="error" variant="outlined">
            {requestError}
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert severity="success" variant="outlined" role="status">
            {successMessage}
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress color="inherit" size={18} /> : undefined}
        >
          <span>{isLoading ? he.login.submitting : he.login.submit}</span>
        </Button>
      </Stack>
    </AuthLayout>
  );
};
