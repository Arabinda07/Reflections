import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = "gathering your thoughts..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 w-full animate-in fade-in duration-700">
      <div className="w-48 h-48 md:w-64 md:h-64">
        <DotLottieReact
          src="https://lottie.host/5227f55d-a0bd-48b5-98a8-04751a6dffb7/4D3o2TMxWZ.lottie"
          loop
          autoplay
        />
      </div>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-[17px] font-medium text-gray-light mt-4 lowercase tracking-wide"
      >
        {message}
      </motion.p>
    </div>
  );
};
