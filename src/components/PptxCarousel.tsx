import { useState, useEffect, useRef, useCallback } from 'react';
import { SlideData } from '@/types/pptx';
import { SlideRenderer } from './SlideRenderer';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PptxCarouselProps {
  slides: SlideData[];
}

export const PptxCarousel = ({ slides }: PptxCarouselProps) => {
  const visibleSlides = slides.filter(s => !s.isHidden);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleSlides.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleSlides.length) % visibleSlides.length);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleSwipeEnd = useCallback((e: React.TouchEvent, direction: 'left' | 'right') => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (direction === 'left' && diff < -threshold) {
      goToNext();
    } else if (direction === 'right' && diff > threshold) {
      goToPrevious();
    }
    touchStartX.current = null;
  }, [currentIndex, visibleSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (visibleSlides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
        <p className="text-muted-foreground">No visible slides to display</p>
      </div>
    );
  }

  const currentSlide = visibleSlides[currentIndex];
  const currentUrl = window.location.href;

  const getSlideTypeColor = (type: SlideData['type']) => {
    switch (type) {
      case 'video':
        return 'bg-accent';
      case 'gif':
        return 'bg-primary';
      case 'link':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Carousel Container */}
      <div className="relative w-full aspect-video bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
        {visibleSlides.map((slide, i) => (
          <div
            key={slide.index}
            style={{ display: i === currentIndex ? 'block' : 'none' }}
            className="w-full h-full"
          >
            <SlideRenderer slide={slide} isActive={i === currentIndex} />
          </div>
        ))}

        {/* Swipe Gesture Zones */}
        {visibleSlides.length > 1 && (
          <>
            <div
              className="absolute left-0 top-0 w-[15%] h-[85%] z-30"
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleSwipeEnd(e, 'right')}
            />
            <div
              className="absolute right-0 top-0 w-[15%] h-[85%] z-30"
              onTouchStart={handleTouchStart}
              onTouchEnd={(e) => handleSwipeEnd(e, 'left')}
            />
          </>
        )}

        {/* Navigation Arrows */}
        {visibleSlides.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 opacity-90 hover:opacity-100"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 opacity-90 hover:opacity-100"
              onClick={goToNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Slide Counter */}
        <div className="absolute bottom-4 right-4 z-40 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
          {currentIndex + 1} / {visibleSlides.length}
        </div>
      </div>

      {/* Dot Indicators */}
      {visibleSlides.length > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {visibleSlides.map((slide, index) => (
            <button
              key={slide.index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                getSlideTypeColor(slide.type),
                currentIndex === index ? "w-8 opacity-100" : "opacity-40 hover:opacity-60"
              )}
              title={`Slide ${slide.index} - ${slide.type}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
