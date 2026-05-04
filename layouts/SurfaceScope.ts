import { useLocation } from 'react-router-dom';
import { RoutePath } from '../types';

const ROUTE_SURFACE_SCOPE_CLASS: Partial<Record<RoutePath, string>> = {
  [RoutePath.HOME]: 'surface-scope-sage',
  [RoutePath.DASHBOARD]: 'surface-scope-sage',
  [RoutePath.NOTES]: 'surface-scope-sage',
  [RoutePath.CREATE_NOTE]: 'surface-scope-paper',
  [RoutePath.RELEASE]: 'surface-scope-clay',
  [RoutePath.FUTURE_LETTERS]: 'surface-scope-honey',
  [RoutePath.ACCOUNT]: 'surface-scope-paper',
  [RoutePath.INSIGHTS]: 'surface-scope-sky',
  [RoutePath.FAQ]: 'surface-scope-sky',
  [RoutePath.ABOUT]: 'surface-scope-paper',
  [RoutePath.PRIVACY]: 'surface-scope-paper',
  [RoutePath.LOGIN]: 'surface-scope-paper',
  [RoutePath.SIGNUP]: 'surface-scope-paper',
  [RoutePath.RESET_PASSWORD]: 'surface-scope-paper',
  [RoutePath.AUTH_CALLBACK]: 'surface-scope-paper',
  [RoutePath.WIKI]: 'surface-scope-sage',
  [RoutePath.SANCTUARY]: 'surface-scope-sage',
};

/**
 * Resolves the route pathname to a surface-scope CSS class.
 * Falls back to sage for unknown routes.
 */
export const getRouteSurfaceScopeClass = (pathname: string) => {
  if (pathname.startsWith('/notes/') && pathname !== RoutePath.CREATE_NOTE) {
    return 'surface-scope-paper';
  }

  if (pathname.startsWith(RoutePath.SANCTUARY)) {
    return 'surface-scope-sage';
  }

  return ROUTE_SURFACE_SCOPE_CLASS[pathname as RoutePath] ?? 'surface-scope-sage';
};

/**
 * Hook that returns the surface-scope CSS class for the current route.
 */
export const useSurfaceScope = () => {
  const location = useLocation();
  return getRouteSurfaceScopeClass(location.pathname);
};
