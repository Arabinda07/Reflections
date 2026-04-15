import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingStateProps {
  message?: string;
  isVisible?: boolean;
}

/**
 * LoadingState - The "Quiet" Loader
 * Used for standard page transitions like "Total Reflections".
 * Replaces the cinematic Spark with the subtle Sandy Loading animation.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "gathering your thoughts...",
  isVisible = true
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-20 px-4 w-full min-h-[400px]"
        >
          <div className="w-48 h-48 md:w-64 md:h-64">
            <DotLottieReact
              src="https://lottie.host/8078516d-3f0e-40e1-ad3d-6b8061148412/o4VygOMtb8.lottie"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
