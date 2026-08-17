import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AuthLayout } from '../../common/components/AuthLayout.component';
import { he } from '../../common/resources/he.resource';
import { NavigationLink } from '../../common/routing/components/NavigationLink.component';
import { FormField } from '../components/FormField.component';
import { useAuthForm } from '../hooks/useAuthForm.hook';
import { normalizeUsername } from '../services/username.service';
import { validatePassword, validateUsername } from '../validators/credentials.validator';
import { register } from './services/register.service';
import { validateDisplayName, validateRegistration } from './validators/registration.validator';

export const RegisterPage = () => {
  const { registerForm, updateRegisterForm, clearRegisterForm } = useAuthForm();
  const { displayName, username, password } = registerForm;
  const [touched, setTouched] = useState({
    displayName: false,
    username: false,
    password: false,
  });
  const [requestError, setRequestError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const errors = {
    displayName: touched.displayName ? validateDisplayName(displayName) : undefined,
    username: touched.username ? validateUsername(username) : undefined,
    password: touched.password ? validatePassword(password) : undefined,
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const nextErrors = validateRegistration(displayName, username, password);

    setTouched({ displayName: true, username: true, password: true });
    setRequestError(undefined);
    setSuccessMessage(undefined);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const normalizedUsername = normalizeUsername(username);

    setIsLoading(true);

    try {
      await register({
        username: normalizedUsername,
        password,
        displayName: displayName.trim(),
      });
      clearRegisterForm();
      setTouched({ displayName: false, username: false, password: false });
      setSuccessMessage(he.register.success);
    } catch {
      setRequestError(he.register.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={he.register.heading}
      description={he.register.description}
      footer={
        <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
          {he.register.hasAccount}{' '}
          <NavigationLink to="/login">{he.register.loginLink}</NavigationLink>
        </Typography>
      }
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <FormField
          id="register-username"
          label={he.register.usernameLabel}
          type="text"
          value={username}
          autoComplete="username"
          onChange={(event) => {
            updateRegisterForm({ username: event.target.value });
            setTouched((current) => ({ ...current, username: true }));
            setRequestError(undefined);
          }}
          error={errors.username}
          disabled={isLoading}
        />
        <FormField
          id="register-password"
          label={he.register.passwordLabel}
          type="password"
          value={password}
          autoComplete="new-password"
          onChange={(event) => {
            updateRegisterForm({ password: event.target.value });
            setTouched((current) => ({ ...current, password: true }));
            setRequestError(undefined);
          }}
          error={errors.password}
          disabled={isLoading}
        />
        <FormField
          id="display-name"
          label={he.register.displayNameLabel}
          type="text"
          value={displayName}
          autoComplete="name"
          onChange={(event) => {
            updateRegisterForm({ displayName: event.target.value });
            setTouched((current) => ({ ...current, displayName: true }));
            setRequestError(undefined);
          }}
          error={errors.displayName}
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
          <span>{isLoading ? he.register.submitting : he.register.submit}</span>
        </Button>
      </Stack>
    </AuthLayout>
  );
};
