import { useContext } from 'react';
import { he } from '../../resources/he.resource';
import { RouterContext } from '../providers/router.context';
import type { RouterContextValue } from '../types/router-context.type';

export const useRouter = (): RouterContextValue => {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error(he.errors.routerProviderMissing);
  }

  return context;
};
