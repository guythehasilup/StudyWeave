import { Box, Paper, Stack, Typography } from '@mui/material';
import { he } from '../resources/he.resource';
import type { AuthLayoutProps } from '../types/auth-layout.type';

export const AuthLayout = ({ title, description, children, footer }: AuthLayoutProps) => (
  <Box
    component="main"
    sx={{ display: 'grid', minHeight: '100dvh', placeItems: 'center', p: { xs: 0, sm: 2, md: 4 } }}
  >
    <Paper
      elevation={0}
      sx={{
        display: 'grid',
        width: 'min(100%, 1040px)',
        minHeight: { xs: '100dvh', sm: 'auto' },
        gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 0.9fr) minmax(360px, 1.1fr)' },
        overflow: 'hidden',
        border: { xs: 0, sm: 1 },
        borderColor: 'divider',
        borderRadius: { xs: 0, sm: 3, md: 4 },
        boxShadow: { xs: 'none', sm: '0 32px 80px rgba(0, 0, 0, 0.35)' },
      }}
    >
      <Stack
        component="aside"
        aria-label={he.common.productName}
        sx={{
          position: 'relative',
          minHeight: { xs: 'auto', md: 560 },
          justifyContent: 'space-between',
          gap: { xs: 4, md: 6 },
          overflow: 'hidden',
          p: { xs: 3, md: 6 },
          background: 'linear-gradient(145deg, rgba(117, 87, 246, 0.24), transparent 55%), #1B2742',
        }}
      >
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
          <Box
            component="img"
            src="/assets/logo.svg"
            alt=""
            sx={{ width: { xs: 64, md: 80 }, height: { xs: 64, md: 80 } }}
          />
          <Typography
            component="span"
            sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800 }}
          >
            {he.common.productName}
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
          {he.common.productDescription}
        </Typography>

        <Box
          className="weave-decoration"
          aria-hidden="true"
          sx={{ display: { xs: 'none', md: 'grid' } }}
        >
          <span />
          <span />
          <span />
        </Box>
      </Stack>

      <Stack
        component="section"
        aria-labelledby="auth-heading"
        sx={{
          justifyContent: { xs: 'flex-start', sm: 'center' },
          p: { xs: 2, sm: 4, md: 5 },
          textAlign: 'right',
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
          sx={{
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          {footer}
        </Box>
      </Stack>
    </Paper>
  </Box>
);
