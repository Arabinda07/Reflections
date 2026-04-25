type AndroidBackAction = () => boolean | void | Promise<boolean | void>;

interface AndroidBackOutcomeInput {
  hasRegisteredAction: boolean;
  isTopLevelRoute: boolean;
  canNavigateBack?: boolean;
  now: number;
  lastExitPromptAt: number | null;
  promptWindowMs?: number;
}

type AndroidBackOutcome =
  | { type: 'registered-action' }
  | { type: 'navigate-back' }
  | { type: 'prompt-exit'; nextExitPromptAt: number }
  | { type: 'exit-app' };

const ANDROID_TOP_LEVEL_ROUTES = new Set([
  '/',
  '/notes',
  '/account',
  '/insights',
  '/login',
  '/signup',
  '/faq',
  '/privacy',
  '/terms',
]);

const DEFAULT_EXIT_PROMPT_WINDOW_MS = 2000;

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
  ANDROID_TOP_LEVEL_ROUTES.has(pathname);

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
  isTopLevelRoute,
  canNavigateBack = false,
  now,
  lastExitPromptAt,
  promptWindowMs = DEFAULT_EXIT_PROMPT_WINDOW_MS,
}: AndroidBackOutcomeInput): AndroidBackOutcome => {
  if (hasRegisteredAction) {
    return { type: 'registered-action' };
  }

  if (canNavigateBack || !isTopLevelRoute) {
    return { type: 'navigate-back' };
  }

  if (lastExitPromptAt !== null && now - lastExitPromptAt <= promptWindowMs) {
    return { type: 'exit-app' };
  }

  return {
    type: 'prompt-exit',
    nextExitPromptAt: now,
  };
};
