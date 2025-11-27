import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SlideData } from '@/types/pptx';
import { PptxParser } from '@/lib/pptxParser';

interface PptxUploaderProps {
  onImagesUploaded: (slides: SlideData[]) => void;
}

export const PptxUploader = ({ onImagesUploaded }: PptxUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePptxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a .pptx file');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Parse PPTX metadata
      toast.success('Parsing presentation metadata...');
      const parser = new PptxParser();
      await parser.loadFile(file);
      const parsed = await parser.parse();

      // Step 2: Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('presentations')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      toast.success('File uploaded! Converting slides to images...');

      // Step 3: Convert PPTX to images via CloudConvert
      const { data, error: convertError } = await supabase.functions.invoke('convert-pptx', {
        body: { filePath: fileName },
      });

      if (convertError) {
        throw convertError;
      }

      // Step 4: Match images with parsed metadata
      const slides: SlideData[] = parsed.slides.map((parsedSlide, index) => ({
        ...parsedSlide,
        imageUrl: data.images[index]?.url || '',
      }));

      // Filter visible slides only
      const visibleSlides = slides.filter(s => !s.isHidden);

      onImagesUploaded(slides);
      toast.success(
        `Presentation converted! ${visibleSlides.length} slides loaded ` +
        `(${parsed.metadata.hiddenSlides} hidden).`
      );
    } catch (error) {
      console.error('Error processing PPTX:', error);
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
          Upload your .pptx file and we'll automatically convert it to interactive slides
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <div>
                <p className="font-medium">Processing your presentation...</p>
                <p className="text-xs">This may take up to a minute depending on the file size.</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <p className="font-medium">✨ Automatic Features</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Parses speaker notes for video/GIF/link slides</li>
              <li>Extracts hotspots and social sharing buttons</li>
              <li>Respects hidden slides and [DOCUMENTATION] notes</li>
              <li>Converts each slide to high-quality PNG</li>
              <li>Maximum file size: 20MB</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
