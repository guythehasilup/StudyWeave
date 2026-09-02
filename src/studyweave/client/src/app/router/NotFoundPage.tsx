import { Button, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { useTranslate } from '../../shared/localization/useTranslate';
import { AuthLayout } from '../../shared/ui/AuthLayout';
import { NavigationLink } from './NavigationLink';

/**
 * Render the localized fallback for an unmatched browser path.
 *
 * @returns A not-found page with an accessible route back to login.
 * @example
 * <NotFoundPage />
 */
export const NotFoundPage = (): ReactElement => {
  const { translate } = useTranslate();

  return (
    <AuthLayout
      title={translate('notFound.heading')}
      description={translate('notFound.description')}
      footer={
        <Typography color="text.secondary">
          <NavigationLink to="/login">{translate('notFound.links.login')}</NavigationLink>
        </Typography>
      }
    >
      <Button component={NavigationLink} to="/login" variant="contained" fullWidth>
        {translate('notFound.action')}
      </Button>
    </AuthLayout>
  );
};
