import { Link } from '@mui/material';
import type { LinkProps } from '@mui/material';
import type { MouseEvent, ReactElement } from 'react';
import { useRouter } from './useRouter';

/**
 * Properties accepted by an internal application link.
 *
 * @example
 * const props: NavigationLinkProps = { to: '/login', children: 'Sign in' };
 */
export type NavigationLinkProps = Readonly<Omit<LinkProps, 'href'> & { to: string }>;

/**
 * Render an MUI link with History API navigation for unmodified clicks.
 *
 * @param props - Internal destination and standard MUI link properties.
 * @returns An accessible anchor that preserves native modified-click behavior.
 * @example
 * <NavigationLink to="/register">Create account</NavigationLink>
 */
export const NavigationLink = ({
  to,
  onClick,
  ...linkProps
}: NavigationLinkProps): ReactElement => {
  const { navigate } = useRouter();

  /**
   * Route ordinary primary-button clicks while preserving browser link behavior.
   *
   * @param event - React anchor click event.
   * @returns Nothing.
   * @example
   * handleClick(event);
   */
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);

    const shouldUseBrowserNavigation =
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;

    if (shouldUseBrowserNavigation) return;

    event.preventDefault();
    navigate(to);
  };

  return <Link {...linkProps} href={to} onClick={handleClick} />;
};
