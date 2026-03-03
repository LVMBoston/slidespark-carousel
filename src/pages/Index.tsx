import { useState } from 'react';
import { SlideData } from '@/types/pptx';
import { PptxUploader } from '@/components/PptxUploader';
import { ZipUploader } from '@/components/ZipUploader';
import { VimeoInput } from '@/components/VimeoInput';
import { PptxCarousel } from '@/components/PptxCarousel';
import { Presentation } from 'lucide-react';

const Index = () => {
  const [slides, setSlides] = useState<SlideData[]>([]);

  const handleImagesUploaded = (updatedSlides: SlideData[]) => {
    setSlides(updatedSlides);
  };

  const handleVimeoSlide = (slide: SlideData) => {
    setSlides((prev) => [...prev, { ...slide, index: prev.length + 1 }]);
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
            PowerPoint Carousel Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transform your PowerPoint presentations into interactive carousels with video, GIFs, and social sharing
          </p>
        </header>

        {/* Upload Section */}
        <div className="mb-12 space-y-6">
          <PptxUploader onImagesUploaded={handleImagesUploaded} />
          <VimeoInput onSlideCreated={handleVimeoSlide} />
        </div>

        {/* Carousel Section */}
        {slides.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Interactive Carousel</h2>
              <p className="text-muted-foreground">
                Use arrow keys or navigation buttons to browse slides
              </p>
            </div>
            <div className="max-w-5xl mx-auto">
              <PptxCarousel slides={slides} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
