import { useEffect, useRef, useState } from 'react';
import { SlideData } from '@/types/pptx';
import { HotspotOverlay } from './HotspotOverlay';
import { Loader2 } from 'lucide-react';

interface SlideRendererProps {
  slide: SlideData;
  isActive: boolean;
}

export const SlideRenderer = ({ slide, isActive }: SlideRendererProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gifKey, setGifKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slide.type === 'gif' && isActive) {
      setGifKey(Date.now());
    }
  }, [isActive, slide.type]);

  useEffect(() => {
    if (videoRef.current) {
      if (!isActive) {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const renderContent = () => {
    // Vimeo/YouTube don't need imageUrl
    if (!slide.imageUrl && slide.type !== 'vimeo' && slide.type !== 'youtube') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Slide {slide.index}: Upload image to view</p>
        </div>
      );
    }

    switch (slide.type) {
      case 'vimeo':
        return (
          <iframe
            src={`https://player.vimeo.com/video/${slide.videoId}?autoplay=0`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={`Vimeo - Slide ${slide.index}`}
          />
        );

      case 'video':
        return (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              poster={slide.imageUrl}
              controls
              onLoadedData={handleImageLoad}
            >
              {slide.mediaUrl && <source src={slide.mediaUrl} type="video/mp4" />}
            </video>
          </>
        );

      case 'gif':
        return (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <img
              src={slide.mediaUrl ? `${slide.mediaUrl}?t=${gifKey}` : slide.imageUrl}
              alt={`Slide ${slide.index}`}
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
            />
          </>
        );

      case 'link':
        return (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <a
              href={slide.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={slide.imageUrl}
                alt={`Slide ${slide.index}`}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
              />
            </a>
          </>
        );

      default:
        return (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            <img
              src={slide.imageUrl}
              alt={`Slide ${slide.index}`}
              className="w-full h-full object-contain"
              onLoad={handleImageLoad}
            />
          </>
        );
    }
  };

  return (
    <div className="relative w-full h-full bg-background">
      {renderContent()}
      {slide.imageUrl && <HotspotOverlay hotspots={slide.hotspots} />}
    </div>
  );
};
