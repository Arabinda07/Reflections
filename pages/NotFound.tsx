import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { RoutePath } from '../types';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-8 h-48 w-48 sm:h-64 sm:w-64">
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="absolute inset-6 rounded-full border border-border/70 bg-white/5" />
          <div className="absolute inset-0 rounded-[2.5rem] border border-border/60 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.14),transparent_62%)]" />
          <div className="absolute inset-[22%] rounded-full border border-green/20 bg-green/5" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-green/25 bg-[rgba(var(--panel-bg-rgb),0.92)] text-green shadow-[0_24px_50px_-30px_rgba(22,163,74,0.42)] sm:h-28 sm:w-28">
            <Leaf size={34} weight="fill" />
          </div>
        </div>
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
