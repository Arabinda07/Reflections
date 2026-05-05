import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type LottieAnimationProps = Pick<
  React.ComponentProps<typeof DotLottieReact>,
  'animationId' | 'autoplay' | 'className' | 'data' | 'dotLottieRefCallback' | 'loop' | 'speed' | 'src'
>;

export const LottieAnimation: React.FC<LottieAnimationProps> = (props) => {
  const [animationData, setAnimationData] = useState<LottieAnimationProps['data'] | null>(null);

  useEffect(() => {
    if (props.src && props.src.endsWith('.json')) {
      fetch(props.src)
        .then((res) => {
          if (!res.ok) throw new Error(`Lottie fetch failed: ${res.status} ${res.url}`);
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('json')) throw new Error(`Lottie got non-JSON response (${ct}) for ${res.url}`);
          return res.json();
        })
        .then((data) => setAnimationData(data))
        .catch((err) => console.error('Failed to load lottie JSON:', err));
    }
  }, [props.src]);

  // If we have a .json src, we MUST wait for the fetch and pass it as `data`.
  if (props.src && props.src.endsWith('.json')) {
    if (!animationData) {
      return <div className={`flex items-center justify-center ${props.className || ''}`} aria-hidden="true" />;
    }
    return <DotLottieReact {...props} src={undefined} data={animationData} />;
  }

  // Otherwise, fallback to the default component (.lottie or static data)
  return <DotLottieReact {...props} />;
};
