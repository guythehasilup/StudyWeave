import { Button, Typography } from '@mui/material';
import { AuthLayout } from '../../components/AuthLayout.component';
import { he } from '../../resources/he.resource';
import { NavigationLink } from '../components/NavigationLink.component';

export const NotFoundPage = () => (
  <AuthLayout
    title={he.notFound.heading}
    description={he.notFound.description}
    footer={
      <Typography color="text.secondary">
        <NavigationLink to="/login">{he.notFound.loginLink}</NavigationLink>
      </Typography>
    }
  >
    <Button component={NavigationLink} to="/login" variant="contained" fullWidth>
      {he.notFound.action}
    </Button>
  </AuthLayout>
);
