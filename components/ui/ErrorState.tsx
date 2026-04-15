import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { RoutePath } from '../../types';

interface ErrorStateProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = "something went quiet.", 
  message = "this path doesn't exist yet, or it's hiding from us.",
  showHomeButton = true
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-700">
      <div className="w-64 h-64 md:w-80 md:h-80 mb-4 scale-110">
        <DotLottieReact
          src="https://lottie.host/63d89663-b2de-49c6-9655-24cae8254144/hOHPpRpxLU.lottie"
          loop
          autoplay
        />
      </div>
      
      <h2 className="text-3xl font-display text-gray-text lowercase mb-4 tracking-tight">
        {title}
      </h2>
      
      <p className="text-[16px] font-medium text-gray-light leading-relaxed mb-8">
        {message}
      </p>
      
      {showHomeButton && (
        <Button 
          variant="secondary" 
          onClick={() => navigate(RoutePath.HOME)}
          className="rounded-[20px] shadow-3d-gray px-8 py-6 font-bold uppercase transition-all active:translate-y-1 active:shadow-none"
        >
          Return Home
        </Button>
      )}
    </div>
  );
};
