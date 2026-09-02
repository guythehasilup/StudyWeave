import type { ComponentType } from 'react';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import type { ResourceKey } from '../../shared/localization/resources';
import { NotFoundPage } from './NotFoundPage';

/**
 * Define one exact-path route and its localized document title.
 *
 * @example
 * const route: RouteDefinition = { path: '/login', titleKey: 'login.heading', component: LoginPage };
 */
export type RouteDefinition = Readonly<{
  path: string;
  titleKey: ResourceKey;
  component: ComponentType;
}>;

export const routes: readonly RouteDefinition[] = [
  { path: '/', titleKey: 'login.heading', component: LoginPage },
  { path: '/login', titleKey: 'login.heading', component: LoginPage },
  {
    path: '/register',
    titleKey: 'register.heading',
    component: RegisterPage,
  },
];

export const fallbackRoute: RouteDefinition = {
  path: '*',
  titleKey: 'notFound.heading',
  component: NotFoundPage,
};
