import type { ComponentType } from 'react';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { QuestionsPage } from '../../features/questions/pages/QuestionsPage';
import type { ResourceKey } from '../../shared/localization/resources';
import { ROUTE_PATHS } from './route-paths';

/**
 * Define one exact-path route and its localized document title.
 *
 * @example
 * const route: RouteDefinition = {
 *   path: '/login',
 *   titleKey: 'login.heading',
 *   component: LoginPage,
 *   access: 'unprotected',
 * };
 */
export type RouteAccess = 'protected' | 'unprotected';

export interface RouteDefinition {
  readonly path: string;
  readonly titleKey: ResourceKey;
  readonly component: ComponentType;
  readonly access: RouteAccess;
}

/** Routes available only when no access token is present. */
export const unprotectedRoutes: readonly RouteDefinition[] = [
  {
    path: ROUTE_PATHS.root,
    titleKey: 'login.heading',
    component: LoginPage,
    access: 'unprotected',
  },
  {
    path: ROUTE_PATHS.login,
    titleKey: 'login.heading',
    component: LoginPage,
    access: 'unprotected',
  },
  {
    path: ROUTE_PATHS.register,
    titleKey: 'register.heading',
    component: RegisterPage,
    access: 'unprotected',
  },
];

/** Routes that require an access token. */
export const protectedRoutes: readonly RouteDefinition[] = [
  {
    path: ROUTE_PATHS.questions,
    titleKey: 'questions.heading',
    component: QuestionsPage,
    access: 'protected',
  },
];

/** All known exact-path routes, preserving their access requirements. */
export const routes: readonly RouteDefinition[] = [...unprotectedRoutes, ...protectedRoutes];
