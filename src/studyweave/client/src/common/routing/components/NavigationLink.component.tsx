import { Link } from '@mui/material';
import type { MouseEvent } from 'react';
import { useRouter } from '../hooks/useRouter.hook';
import type { NavigationLinkProps } from '../types/navigation-link.type';

export const NavigationLink = ({ to, onClick, ...linkProps }: NavigationLinkProps) => {
  const { navigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);

    const shouldUseBrowserNavigation =
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;

    if (shouldUseBrowserNavigation) {
      return;
    }

    event.preventDefault();
    navigate(to);
  };

  return <Link {...linkProps} href={to} onClick={handleClick} />;
};
