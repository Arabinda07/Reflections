import React, { Suspense, lazy } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { RoutePath } from '../types';

const error404Animation = '/assets/lottie/Error%20404.json';

const LottieAnimation = lazy(() => import('../components/ui/LottieAnimation').then((module) => ({
  default: module.LottieAnimation,
})));

const getRouteErrorCopy = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: "This path doesn't exist yet.",
        description: "The page you were trying to open drifted out of reach. Let's guide you back to a calmer place.",
        detail: `${error.status} ${error.statusText}`,
      };
    }

    return {
      title: 'Something interrupted this page.',
      description: 'The route loaded into an unexpected state. You can try this path again or return home.',
      detail: `${error.status} ${error.statusText}`,
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Something interrupted this page.',
      description: 'A route-level error interrupted the experience before it could settle.',
      detail: error.message,
    };
  }

  return {
    title: 'Something interrupted this page.',
    description: 'The app hit an unexpected route error. You can reload the page or return home.',
    detail: 'Unknown route error',
  };
};

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const { title, description, detail } = getRouteErrorCopy(error);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-body text-gray-text">
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="h-64 w-64 sm:h-80 sm:w-80">
          <Suspense fallback={<div className="h-full w-full rounded-[var(--radius-panel)] bg-green/5" />}>
            <LottieAnimation src={error404Animation} autoplay loop />
          </Suspense>
        </div>

        <span className="label-caps text-gray-nav">Route recovery</span>
        <h1 className="mt-5 max-w-[10ch] text-mk-display leading-[0.92] tracking-normal">
          {title}
        </h1>
        <p className="mt-4 max-w-[34rem] font-serif text-[1rem] leading-[1.72] text-gray-light sm:text-[1.125rem]">
          {description}
        </p>
        <p className="mt-3 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-gray-nav/70">
          {detail}
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-[var(--radius-control)] border border-transparent bg-green px-5 py-4 text-[16px] font-bold text-white shadow-lg shadow-green/20 transition-[background-color,box-shadow,transform] duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-green-hover hover:shadow-xl hover:shadow-green/30 active:translate-y-0 sm:w-auto sm:px-8"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => navigate(RoutePath.HOME)}
            className="control-surface inline-flex min-h-14 w-full items-center justify-center rounded-[var(--radius-control)] px-5 py-4 text-[16px] font-bold text-gray-text transition-[background-color,border-color,color,transform] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-green/20 hover:bg-green/5 active:translate-y-0 sm:w-auto sm:px-8"
          >
            Return home
          </button>
        </div>
      </div>
    </div>
  );
};
