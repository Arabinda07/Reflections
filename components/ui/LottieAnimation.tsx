import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

type LottieAnimationProps = {
  src?: string;
  animationData?: unknown;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
};

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  animationData: providedData,
  className,
  autoplay = true,
  loop = true,
  ...rest
}) => {
  const [animationData, setAnimationData] = useState<unknown>(providedData || null);

  useEffect(() => {
    if (src && !providedData) {
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error(`Lottie fetch failed: ${res.status}`);
          return res.json();
        })
        .then((data) => setAnimationData(data))
        .catch((err) => console.error('Failed to load lottie JSON:', err));
    }
  }, [src, providedData]);

  if (!animationData) {
    return <div className={`flex items-center justify-center ${className || ''}`} aria-hidden="true" />;
  }

  return (
    <Lottie 
      animationData={animationData} 
      className={className} 
      autoplay={autoplay} 
      loop={loop} 
      {...rest} 
    />
  );
};
