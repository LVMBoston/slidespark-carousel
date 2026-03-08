import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SlideData } from '@/types/pptx';
import JSZip from 'jszip';

interface ZipUploaderProps {
  onImagesUploaded: (slides: SlideData[]) => void;
}

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp)$/i;

export const ZipUploader = ({ onImagesUploaded }: ZipUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please upload a .zip file');
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // Collect image files, sorted by name
      const imageFiles = Object.keys(zip.files)
        .filter(name => !zip.files[name].dir && IMAGE_EXTENSIONS.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      if (imageFiles.length === 0) {
        toast.error('No images found in the zip file');
        setIsProcessing(false);
        return;
      }

      const slides: SlideData[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const blob = await zip.file(imageFiles[i])?.async('blob');
        if (!blob) continue;

        const url = URL.createObjectURL(blob);
        slides.push({
          index: i + 1,
          slideType: 'image',
          type: 'image',
          imageFile: url,
          imageUrl: url,
          hotspots: [],
          isHidden: false,
          downloadFiles: [],
        });
      }

      onImagesUploaded(slides);
      toast.success(`Loaded ${slides.length} slides from zip file`);
    } catch (error) {
      console.error('Error processing zip:', error);
      toast.error('Failed to process zip file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-primary" />
          Upload Zip of Slide Images
        </CardTitle>
        <CardDescription>
          Upload a .zip file containing PNG/JPG images — each image becomes a slide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Label htmlFor="zip-file">Zip File (.zip)</Label>
          <Input
            id="zip-file"
            type="file"
            accept=".zip"
            onChange={handleZipUpload}
            disabled={isProcessing}
            className="cursor-pointer"
          />
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting images...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
