import { RoutePath } from '../../types';

type AndroidBackAction = () => boolean | void | Promise<boolean | void>;

interface AndroidBackOutcomeInput {
  hasRegisteredAction: boolean;
  pathname: string;
  canNavigateBack?: boolean;
  now: number;
  lastExitPromptAt: number | null;
  promptWindowMs?: number;
}

type AndroidBackOutcome =
  | { type: 'registered-action' }
  | { type: 'navigate-back' }
  | { type: 'navigate-to-fallback'; path: string }
  | { type: 'prompt-exit'; nextExitPromptAt: number }
  | { type: 'exit-app' };

const ANDROID_TOP_LEVEL_ROUTES = new Set<string>([
  RoutePath.HOME,
  RoutePath.DASHBOARD,
  RoutePath.NOTES,
  RoutePath.ACCOUNT,
  RoutePath.INSIGHTS,
  RoutePath.FUTURE_LETTERS,
  RoutePath.LOGIN,
  RoutePath.SIGNUP,
  RoutePath.RESET_PASSWORD,
  RoutePath.FAQ,
  RoutePath.ABOUT,
  RoutePath.PRIVACY,
  RoutePath.TERMS,
  RoutePath.WIKI,
  RoutePath.SANCTUARY,
]);

const DEFAULT_EXIT_PROMPT_WINDOW_MS = 2000;

const normalizePathname = (pathname: string) => {
  if (pathname === RoutePath.HOME) {
    return RoutePath.HOME;
  }

  return pathname.replace(/\/+$/, '');
};

export const createAndroidBackActionRegistry = () => {
  const actions: AndroidBackAction[] = [];

  return {
    register(action: AndroidBackAction) {
      actions.push(action);

      return () => {
        const index = actions.lastIndexOf(action);
        if (index >= 0) {
          actions.splice(index, 1);
        }
      };
    },

    async runTopmost() {
      const action = actions[actions.length - 1];

      if (!action) {
        return false;
      }

      const result = await action();
      return result !== false;
    },

    hasHandlers() {
      return actions.length > 0;
    },
  };
};

export const androidBackActionRegistry = createAndroidBackActionRegistry();

export const registerAndroidBackAction = (action: AndroidBackAction) =>
  androidBackActionRegistry.register(action);

export const isTopLevelAndroidRoute = (pathname: string) =>
  ANDROID_TOP_LEVEL_ROUTES.has(normalizePathname(pathname));

export const getAndroidBackFallbackPath = (pathname: string) => {
  const normalizedPathname = normalizePathname(pathname);

  if (isTopLevelAndroidRoute(normalizedPathname)) {
    return null;
  }

  if (normalizedPathname.startsWith(`${RoutePath.NOTES}/`)) {
    return RoutePath.NOTES;
  }

  if (normalizedPathname.startsWith(`${RoutePath.SANCTUARY}/`)) {
    return RoutePath.SANCTUARY;
  }

  return RoutePath.DASHBOARD;
};

export const canNavigateBackInApp = (
  historyState?: { idx?: unknown } | null,
  historyLength?: number | null,
) => {
  if (typeof historyState?.idx === 'number') {
    return historyState.idx > 0;
  }

  if (typeof historyLength === 'number') {
    return historyLength > 1;
  }

  return false;
};

export const resolveAndroidBackOutcome = ({
  hasRegisteredAction,
  pathname,
  canNavigateBack = false,
  now,
  lastExitPromptAt,
  promptWindowMs = DEFAULT_EXIT_PROMPT_WINDOW_MS,
}: AndroidBackOutcomeInput): AndroidBackOutcome => {
  if (hasRegisteredAction) {
    return { type: 'registered-action' };
  }

  if (isTopLevelAndroidRoute(pathname)) {
    if (lastExitPromptAt !== null && now - lastExitPromptAt <= promptWindowMs) {
      return { type: 'exit-app' };
    }

    return {
      type: 'prompt-exit',
      nextExitPromptAt: now,
    };
  }

  if (canNavigateBack) {
    return { type: 'navigate-back' };
  }

  const fallbackPath = getAndroidBackFallbackPath(pathname);

  if (fallbackPath) {
    return { type: 'navigate-to-fallback', path: fallbackPath };
  }

  return {
    type: 'prompt-exit',
    nextExitPromptAt: now,
  };
};
