import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { Image as ImageSquare } from '@phosphor-icons/react/Image';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path?: string | null;
  fallbackSrc?: string;
  showLoading?: boolean;
}

const isDirectSrc = (path?: string | null): path is string =>
  !!path && (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:'));

export const StorageImage: React.FC<StorageImageProps> = ({ 
  path, 
  fallbackSrc,
  className = '', 
  alt,
  showLoading = true,
  ...props 
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [node, setNode] = useState<HTMLElement | null>(null);
  // Signed URLs are only worth fetching once the image approaches the viewport.
  // Direct URLs (avatars, blob previews) never need signing, so they load eagerly.
  const needsSigning = !!path && !isDirectSrc(path);
  const [isInView, setIsInView] = useState(!needsSigning);

  useEffect(() => {
    setIsInView(!needsSigning);
  }, [needsSigning, path]);

  useEffect(() => {
    if (isInView || !node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, isInView]);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;
    
    const loadSrc = async () => {
      setLoading(true);
      if (!path) {
        setSrc(fallbackSrc || null);
        setLoading(false);
        return;
      }
      
      // If it's already a full URL (e.g. Google avatar or blob preview)
      if (isDirectSrc(path)) {
        setSrc(path);
        setLoading(false);
        return;
      }

      // Hold the placeholder until the element is near the viewport.
      if (!isInView) return;

      try {
        const url = await storageService.getSignedUrl(path);
        if (url.startsWith('blob:')) objectUrl = url;
        if (isMounted) {
          setSrc(url);
        } else if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        console.error("Failed to load image", err);
        if (isMounted) setSrc(fallbackSrc || null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSrc();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, fallbackSrc, isInView]);

  if (loading && showLoading) {
    return (
      <div
        ref={setNode}
        className={`surface-inline-panel flex items-center justify-center rounded-none border-0 ${className}`}
      >
        <CircleNotch className="animate-spin text-gray-nav" size={20} weight="bold" />
      </div>
    );
  }

  if (!src) {
     return (
       <div
         ref={setNode}
         className={`surface-inline-panel flex items-center justify-center rounded-none border-0 text-gray-nav ${className}`}
       >
         <ImageSquare size={24} weight="duotone" />
       </div>
     );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setSrc(fallbackSrc || null)}
      {...props}
    />
  );
};
