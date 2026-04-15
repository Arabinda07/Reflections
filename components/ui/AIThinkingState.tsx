import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

export const AIThinkingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-border animate-in fade-in duration-500 min-h-[280px]">
      <div className="w-48 h-48">
        <DotLottieReact
          src="https://lottie.host/5227f55d-a0bd-48b5-98a8-04751a6dffb7/4D3o2TMxWZ.lottie"
          loop
          autoplay
        />
      </div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[14px] font-bold text-gray-light uppercase tracking-widest mt-4"
      >
        gathering deep reflections...
      </motion.p>
    </div>
  );
};
