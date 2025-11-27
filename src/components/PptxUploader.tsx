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
    console.log('🚀 Starting PPTX upload:', file.name);
    
    try {
      // Step 1: Parse PPTX metadata
      console.log('📋 Step 1: Parsing metadata...');
      toast.info('Parsing presentation metadata...');
      const parser = new PptxParser();
      await parser.loadFile(file);
      const parsed = await parser.parse();
      console.log('✅ Parsed:', parsed.metadata);

      // Step 2: Upload file to Supabase Storage
      console.log('☁️ Step 2: Uploading to storage...');
      toast.info('Uploading file to storage...');
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('presentations')
        .upload(fileName, file);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }
      console.log('✅ Uploaded:', fileName);

      // Step 3: Convert PPTX to images via CloudConvert
      console.log('🎨 Step 3: Converting to images...');
      toast.info('Converting slides to images (this may take up to 1 minute)...');
      const { data, error: convertError } = await supabase.functions.invoke('convert-pptx', {
        body: { filePath: fileName },
      });

      if (convertError) {
        console.error('❌ Conversion error:', convertError);
        throw convertError;
      }
      console.log('✅ Converted:', data);

      // Step 4: Match images with parsed metadata and create legacy SlideData format
      console.log('🔗 Step 4: Matching images with metadata...');
      const slides: SlideData[] = parsed.slides.map((parsedSlide, index) => ({
        ...parsedSlide,
        type: parsedSlide.slideType,
        imageUrl: data.images[index]?.url || parsedSlide.imageFile,
      }));
      console.log('✅ Final slides:', slides.length, 'slides created');

      // Filter visible slides only
      const visibleSlides = slides.filter(s => !s.isHidden);

      onImagesUploaded(slides);
      toast.success(
        `Presentation converted! ${visibleSlides.length} slides loaded ` +
        `(${parsed.metadata.hiddenSlides} hidden).`
      );
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
            <div className="flex items-center gap-3 text-sm p-6 bg-primary/5 border-2 border-primary/20 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-primary flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Processing your presentation...</p>
                <p className="text-xs text-muted-foreground">Parsing → Uploading → Converting to images</p>
                <p className="text-xs text-muted-foreground">This may take up to 1 minute depending on file size.</p>
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
