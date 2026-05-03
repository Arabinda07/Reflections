type ScreenGroup =
  | 'home'
  | 'auth'
  | 'notes'
  | 'note_editor'
  | 'note_detail'
  | 'account'
  | 'insights'
  | 'support'
  | 'legal'
  | 'other';

type CaptureFn = (eventName: string, properties: Record<string, unknown>) => void;

type RouteLocation = {
  pathname: string;
  search?: string;
  hash?: string;
};

const NOTE_DETAIL_PATTERN = /^\/notes\/[^/]+$/;

export const getScreenGroup = (pathname: string): ScreenGroup => {
  if (pathname === '/') return 'home';
  if (pathname === '/login' || pathname === '/signup' || pathname === '/reset-password') return 'auth';
  if (pathname === '/notes') return 'notes';
  if (pathname === '/notes/new' || pathname.endsWith('/edit')) return 'note_editor';
  if (NOTE_DETAIL_PATTERN.test(pathname)) return 'note_detail';
  if (pathname === '/account') return 'account';
  if (pathname === '/insights') return 'insights';
  if (pathname === '/faq') return 'support';
  if (pathname === '/privacy') return 'legal';
  return 'other';
};

const formatRoute = ({ pathname, search = '', hash = '' }: RouteLocation) =>
  `${pathname}${search}${hash}`;

export const createScreenViewTracker = ({
  capture,
  isNative,
}: {
  capture: CaptureFn;
  isNative: boolean;
}) => {
  let lastRoute: string | null = null;

  return (location: RouteLocation) => {
    const route = formatRoute(location);

    if (route === lastRoute) {
      return false;
    }

    lastRoute = route;
    capture('screen_view', {
      route,
      screen_group: getScreenGroup(location.pathname),
      is_native: isNative,
    });
    return true;
  };
};
