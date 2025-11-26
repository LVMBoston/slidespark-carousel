import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SlideData } from '@/types/pptx';

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
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('presentations')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      toast.success('File uploaded! Converting to images...');

      // Call edge function to convert PPTX
      const { data, error: convertError } = await supabase.functions.invoke('convert-pptx', {
        body: { filePath: fileName },
      });

      if (convertError) {
        throw convertError;
      }

      // Convert the image URLs to slide data format
      const slides: SlideData[] = data.images.map((file: any, index: number) => ({
        id: `slide-${index + 1}`,
        imageUrl: file.url,
        hotspots: [],
      }));

      onImagesUploaded(slides);
      toast.success(`Presentation converted! ${data.images.length} slides loaded.`);
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
            <p className="font-medium">✨ Automatic Conversion</p>
            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
              <li>Each slide will be converted to a high-quality image</li>
              <li>Maintains original formatting and design</li>
              <li>Maximum file size: 20MB</li>
              <li>Conversion typically takes 30-60 seconds</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
