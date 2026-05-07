import React, { useEffect, useState } from 'react';
import { strFromU8, unzipSync } from 'fflate';
import Lottie from 'lottie-react';

type LottieAnimationProps = Omit<React.ComponentProps<typeof Lottie>, 'animationData'> & {
  src?: string;
  animationData?: unknown;
  animationId?: string;
};

const getDotLottieAnimation = async (response: Response) => {
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const manifest = files['manifest.json'] ? JSON.parse(strFromU8(files['manifest.json'])) : null;
  const manifestPath = manifest?.animations?.[0]?.id
    ? `animations/${manifest.animations[0].id}.json`
    : undefined;
  const animationPath =
    manifestPath && files[manifestPath]
      ? manifestPath
      : Object.keys(files).find((filePath) => filePath.startsWith('animations/') && filePath.endsWith('.json'));

  if (!animationPath) {
    throw new Error('DotLottie archive did not contain a JSON animation.');
  }

  return JSON.parse(strFromU8(files[animationPath]));
};

const loadLottieAnimation = async (src: string) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Lottie fetch failed: ${response.status}`);

  if (src.endsWith('.lottie')) {
    return getDotLottieAnimation(response);
  }

  return response.json();
};

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  src,
  animationData: providedData,
  animationId,
  className,
  autoplay = true,
  loop = true,
  ...rest
}) => {
  const [animationData, setAnimationData] = useState<unknown>(providedData || null);

  useEffect(() => {
    if (src && !providedData) {
      loadLottieAnimation(src)
        .then((data) => setAnimationData(data))
        .catch((err) => console.error('Failed to load lottie JSON:', err));
    }
  }, [src, providedData]);

  if (!animationData) {
    return <div className={`flex items-center justify-center ${className || ''}`} aria-hidden="true" />;
  }

  return (
    <Lottie
      {...rest}
      id={animationId}
      animationData={animationData}
      className={className}
      autoplay={autoplay}
      loop={loop}
    />
  );
};
