import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SlideData } from '@/types/pptx';
import { PptxParser } from '@/lib/pptxParser';

interface PptxUploaderProps {
  onImagesUploaded: (slides: SlideData[]) => void;
}

export const PptxUploader = ({ onImagesUploaded }: PptxUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalSlides, setTotalSlides] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const handlePptxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a .pptx file');
      return;
    }

    setIsProcessing(true);
    setTotalSlides(0);
    setCurrentStep('Parsing presentation...');
    console.log('🚀 Starting PPTX upload:', file.name);
    
    try {
      // Step 1: Parse PPTX and extract images directly (no external conversion needed)
      console.log('📋 Parsing and extracting slide images...');
      toast.info('Parsing presentation and extracting slides...');
      
      const parser = new PptxParser();
      await parser.loadFile(file);
      
      setCurrentStep('Extracting slides...');
      const parsed = await parser.parse();
      setTotalSlides(parsed.metadata.totalSlides);
      console.log('✅ Parsed:', parsed.metadata);

      // Step 2: Create SlideData format with extracted images
      setCurrentStep('Finalizing...');
      console.log('🔗 Creating slide data...');
      
      const slides: SlideData[] = parsed.slides.map((parsedSlide) => ({
        ...parsedSlide,
        type: parsedSlide.slideType,
        imageUrl: parsedSlide.imageFile, // Use extracted image from PPTX
      }));
      
      console.log('✅ Final slides:', slides.length, 'slides created');

      // Count slides with images
      const slidesWithImages = slides.filter(s => s.imageUrl).length;
      const visibleSlides = slides.filter(s => !s.isHidden);

      onImagesUploaded(slides);
      
      if (slidesWithImages === 0) {
        toast.warning(
          `Presentation loaded with ${visibleSlides.length} slides, but no embedded images were found. ` +
          `Some PPTX files use vector graphics instead of embedded images.`
        );
      } else {
        toast.success(
          `Presentation loaded! ${visibleSlides.length} slides ` +
          `(${parsed.metadata.hiddenSlides} hidden, ${slidesWithImages} with images).`
        );
      }
    } catch (error) {
      console.error('❌ Error processing PPTX:', error);
      toast.error('Failed to process presentation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Upload PowerPoint Presentation
        </CardTitle>
        <CardDescription>
          Upload your .pptx file and we'll extract and display your slides instantly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pptx-file">PowerPoint File (.pptx)</Label>
            <div className="relative">
              <Input
                id="pptx-file"
                type="file"
                accept=".pptx"
                onChange={handlePptxUpload}
                disabled={isProcessing}
                className="cursor-pointer"
              />
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-3 text-sm p-6 bg-primary/5 border-2 border-primary/20 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-primary flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {currentStep}
                  {totalSlides > 0 && (
                    <span className="ml-2 text-primary">({totalSlides} slides)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Parsing → Extracting → Finalizing</p>
                <p className="text-xs text-muted-foreground">Processing happens locally in your browser.</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <p className="font-medium">✨ Features</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Parses speaker notes for video/GIF/link slides</li>
              <li>Extracts hotspots and social sharing buttons</li>
              <li>Respects hidden slides and [DOCUMENTATION] notes</li>
              <li>Extracts embedded images directly from PPTX</li>
              <li>No external conversion - fast local processing</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
