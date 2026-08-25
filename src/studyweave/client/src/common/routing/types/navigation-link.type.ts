import type { LinkProps } from '@mui/material';

export interface NavigationLinkProps extends Omit<LinkProps, 'href'> {
  to: string;
}
