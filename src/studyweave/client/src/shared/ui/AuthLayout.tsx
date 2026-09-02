import { alpha } from '@mui/material/styles';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactElement, ReactNode } from 'react';
import logoUrl from '../../../assets/logo.svg';
import { useTranslate } from '../localization/useTranslate';

/**
 * Configure the shared authentication-page shell.
 *
 * @example
 * const props: AuthLayoutProps = { title: 'Sign in', description: 'Continue', children: form, footer };
 */
export type AuthLayoutProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}>;

/**
 * Render the responsive product panel and authentication content shell.
 *
 * @param props - Localized heading, description, form content, and footer.
 * @returns An accessible responsive MUI layout.
 * @example
 * <AuthLayout title={title} description={description} footer={footer}>{form}</AuthLayout>
 */
export const AuthLayout = ({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps): ReactElement => {
  const { translate } = useTranslate();

  return (
    <Box
      component="main"
      sx={{
        display: 'grid',
        minHeight: '100dvh',
        placeItems: 'center',
        p: { xs: 0, sm: 2, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'grid',
          width: 'min(100%, 1040px)',
          minHeight: { xs: '100dvh', sm: 'auto' },
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(280px, 0.9fr) minmax(360px, 1.1fr)',
          },
          overflow: 'hidden',
          border: { xs: 0, sm: 1 },
          borderColor: 'divider',
          borderRadius: { xs: 0, sm: 3, md: 4 },
          boxShadow: { xs: 'none', sm: 8 },
        }}
      >
        <Stack
          component="aside"
          aria-label={translate('common.productName')}
          sx={(theme) => ({
            position: 'relative',
            minHeight: { xs: 'auto', md: 560 },
            justifyContent: 'space-between',
            gap: { xs: 4, md: 6 },
            overflow: 'hidden',
            p: { xs: 3, md: 6 },
            background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.24)}, transparent 55%), ${alpha(theme.palette.primary.main, 0.08)}`,
          })}
        >
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Box
              component="img"
              src={logoUrl}
              alt=""
              sx={{ width: { xs: 64, md: 80 }, height: { xs: 64, md: 80 } }}
            />
            <Typography
              component="span"
              sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800 }}
            >
              {translate('common.productName')}
            </Typography>
          </Stack>

          <Typography
            sx={{
              display: { xs: 'none', md: 'block' },
              maxWidth: '15ch',
              my: 'auto',
              fontSize: 'clamp(1.75rem, 3.2vw, 2.6rem)',
              fontWeight: 700,
              lineHeight: 1.35,
            }}
          >
            {translate('common.productDescription')}
          </Typography>

          <Stack
            aria-hidden="true"
            spacing={1}
            sx={{ display: { xs: 'none', md: 'flex' }, rotate: '-7deg', opacity: 0.75 }}
          >
            {[1, 0.82, 0.64].map((width) => (
              <Box
                key={width}
                sx={(theme) => ({
                  width,
                  height: 8,
                  marginInlineStart: width === 0.82 ? 'auto' : 0,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main} 20%, ${theme.palette.success.main} 80%, transparent)`,
                })}
              />
            ))}
          </Stack>
        </Stack>

        <Stack
          component="section"
          aria-labelledby="auth-heading"
          sx={{
            justifyContent: { xs: 'flex-start', sm: 'center' },
            p: { xs: 2, sm: 4, md: 5 },
            textAlign: 'start',
          }}
        >
          <Box component="header" sx={{ mb: 3, textAlign: 'center' }}>
            <Typography id="auth-heading" component="h1" variant="h1" sx={{ mb: 2 }}>
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
              {description}
            </Typography>
          </Box>

          {children}

          <Box
            component="footer"
            sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}
          >
            {footer}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};
