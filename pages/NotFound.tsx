import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { LottieAnimation } from '../components/ui/LottieAnimation';
import { Button } from '../components/ui/Button';
import { RoutePath } from '../types';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 h-48 w-48 sm:h-64 sm:w-64 max-w-full">
        <LottieAnimation src="/assets/lottie/Error 404.json" className="h-full w-full" autoplay loop />
      </div>
      <h1 className="text-4xl font-display text-gray-text mb-4">A quiet corner.</h1>
      <p className="max-w-md text-gray-light font-medium mb-10">
        There are no notes written here yet. You may have followed a broken link, or this page is still finding its way.
      </p>
      <Button variant="primary" size="lg" onClick={() => navigate(RoutePath.HOME)} className="rounded-2xl border-2 border-border shadow-sm px-8 font-black">
        <ArrowLeft size={18} weight="bold" className="mr-2" />
        Return home
      </Button>
    </div>
  );
};
