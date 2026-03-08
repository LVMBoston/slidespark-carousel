import { useState } from 'react';
import { SlideData } from '@/types/slides';
import { ZipUploader } from '@/components/ZipUploader';
import { VimeoInput } from '@/components/VimeoInput';
import { PptxCarousel } from '@/components/PptxCarousel';
import { Presentation, Play, Image, Video, FileText, Link, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselKey, setCarouselKey] = useState(0);

  const handleImagesUploaded = (updatedSlides: SlideData[]) => {
    setSlides(updatedSlides);
  };

  const handleVimeoInsert = (slide: SlideData, afterIndex: number | null) => {
    setSlides((prev) => {
      const visibleSlides = prev.filter(s => !s.isHidden);
      if (afterIndex === null || visibleSlides.length === 0) {
        // Append at end
        return [...prev, { ...slide, index: prev.length + 1 }];
      }
      // Find the actual position in the full array of the visible slide at afterIndex
      const targetSlide = visibleSlides[afterIndex];
      const actualIndex = prev.indexOf(targetSlide);
      const newSlide = { ...slide, index: prev.length + 1 };
      const updated = [...prev];
      updated.splice(actualIndex + 1, 0, newSlide);
      // Re-index
      return updated.map((s, i) => ({ ...s, index: i + 1 }));
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[var(--shadow-lg)]">
              <Presentation className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            Interactive Carousel Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build interactive carousels with images, video, GIFs, and social sharing
          </p>
        </header>

        {/* Status Bar */}
        {(() => {
          const visible = slides.filter(s => !s.isHidden);
          const counts = visible.reduce((acc, s) => {
            acc[s.type] = (acc[s.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          return (
            <div className="flex items-center justify-center gap-3 flex-wrap mb-8 px-4 py-2.5 rounded-full bg-muted/60 border border-border/50 max-w-2xl mx-auto">
              <Badge variant="secondary" className="gap-1.5">
                <Presentation className="w-3.5 h-3.5" />
                {visible.length} total
              </Badge>
              {(counts.image || 0) > 0 && (
                <Badge variant="outline" className="gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  {counts.image} image{counts.image > 1 ? 's' : ''}
                </Badge>
              )}
              {((counts.vimeo || 0) + (counts.video || 0) + (counts.youtube || 0)) > 0 && (
                <Badge variant="outline" className="gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  {(counts.vimeo || 0) + (counts.video || 0) + (counts.youtube || 0)} video{((counts.vimeo || 0) + (counts.video || 0) + (counts.youtube || 0)) > 1 ? 's' : ''}
                </Badge>
              )}
              {(counts.gif || 0) > 0 && (
                <Badge variant="outline" className="gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {counts.gif} GIF{counts.gif > 1 ? 's' : ''}
                </Badge>
              )}
              {(counts.link || 0) > 0 && (
                <Badge variant="outline" className="gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  {counts.link} link{counts.link > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          );
        })()}

        {/* Upload Section */}
        <div className="mb-12 space-y-6">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Presentation className="w-4 h-4" />
                  Upload PowerPoint Presentation
                </span>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <PptxUploader onImagesUploaded={handleImagesUploaded} />
            </CollapsibleContent>
          </Collapsible>
          <ZipUploader onImagesUploaded={handleImagesUploaded} />
          <VimeoInput slides={slides} onSlideInserted={handleVimeoInsert} />
        </div>

        {/* Show Carousel Button */}
        {slides.length > 0 && !showCarousel && (
          <div className="text-center mb-12">
            <Button size="lg" onClick={() => setShowCarousel(true)} className="gap-2">
              <Play className="w-5 h-5" />
              Display Carousel
            </Button>
          </div>
        )}

        {/* Carousel Section */}
        {slides.length > 0 && showCarousel && (
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-2xl font-bold">Interactive Carousel</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCarouselKey(k => k + 1)}
                title="Reset carousel (restart all videos)"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSlides([]); setShowCarousel(false); }}
                title="Clear carousel"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Use arrow keys or navigation buttons to browse slides
            </p>
            <div className="max-w-5xl mx-auto">
              <PptxCarousel key={carouselKey} slides={slides} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
