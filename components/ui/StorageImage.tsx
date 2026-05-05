import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';
import { CircleNotch, Image as ImageSquare } from '@phosphor-icons/react';

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path?: string | null;
  fallbackSrc?: string;
  showLoading?: boolean;
}

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

  useEffect(() => {
    let isMounted = true;
    
    const loadSrc = async () => {
      setLoading(true);
      if (!path) {
        setSrc(fallbackSrc || null);
        setLoading(false);
        return;
      }
      
      // If it's already a full URL (e.g. Google avatar or blob preview)
      if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
        setSrc(path);
        setLoading(false);
        return;
      }

      try {
        const url = await storageService.getSignedUrl(path);
        if (isMounted) setSrc(url);
      } catch (err) {
        console.error("Failed to load image", err);
        if (isMounted) setSrc(fallbackSrc || null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSrc();
    return () => { isMounted = false; };
  }, [path, fallbackSrc]);

  if (loading && showLoading) {
    return (
      <div className={`surface-inline-panel flex items-center justify-center rounded-none border-0 ${className}`}>
        <CircleNotch className="animate-spin text-gray-nav" size={20} weight="bold" />
      </div>
    );
  }

  if (!src) {
     return (
       <div className={`surface-inline-panel flex items-center justify-center rounded-none border-0 text-gray-nav ${className}`}>
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
