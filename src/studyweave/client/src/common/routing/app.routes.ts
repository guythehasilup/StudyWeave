import { LoginPage } from '../../auth/login/Login.page';
import { AuthFormProvider } from '../../auth/providers/AuthForm.provider';
import { RegisterPage } from '../../auth/register/Register.page';
import { he } from '../resources/he.resource';
import { PlainLayout } from './layouts/Plain.layout';
import { NotFoundPage } from './not-found/NotFound.page';
import type { RouteDefinition } from './types/route-definition.type';

export const routes: RouteDefinition[] = [
  { path: '/', title: he.login.heading, component: LoginPage, layout: AuthFormProvider },
  { path: '/login', title: he.login.heading, component: LoginPage, layout: AuthFormProvider },
  {
    path: '/register',
    title: he.register.heading,
    component: RegisterPage,
    layout: AuthFormProvider,
  },
];

export const fallbackRoute: RouteDefinition = {
  path: '*',
  title: he.notFound.heading,
  component: NotFoundPage,
  layout: PlainLayout,
};
