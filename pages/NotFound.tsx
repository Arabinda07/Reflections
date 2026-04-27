import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from '../components/ui/Button';
import { RoutePath } from '../types';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-4 h-48 w-48 sm:h-64 sm:w-64 max-w-full">
        <DotLottieReact src="/assets/lottie/Error 404.json" autoplay loop />
      </div>
      <h1 className="text-4xl font-display text-gray-text mb-4">This path doesn't exist yet.</h1>
      <p className="max-w-md text-gray-light font-medium mb-10">
        It's hiding in the quiet space between thoughts. Let's head back home.
      </p>
      <Button variant="primary" size="lg" onClick={() => navigate(RoutePath.HOME)} className="rounded-2xl border-2 border-border shadow-sm px-8 font-black">
        <ArrowLeft size={18} weight="bold" className="mr-2" />
        Return home
      </Button>
    </div>
  );
};
