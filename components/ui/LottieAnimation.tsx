import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type LottieAnimationProps = Pick<
  React.ComponentProps<typeof DotLottieReact>,
  'autoplay' | 'className' | 'data' | 'dotLottieRefCallback' | 'loop' | 'speed' | 'src'
>;

export const LottieAnimation: React.FC<LottieAnimationProps> = (props) => {
  return <DotLottieReact {...props} />;
};
