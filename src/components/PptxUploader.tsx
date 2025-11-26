import { useState } from 'react';
import { PptxParser } from '@/lib/pptxParser';
import { ParsedPptx, SlideData } from '@/types/pptx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PptxUploaderProps {
  onParsed: (data: ParsedPptx) => void;
  onImagesUploaded: (slides: SlideData[]) => void;
}

export const PptxUploader = ({ onParsed, onImagesUploaded }: PptxUploaderProps) => {
  const [isParsingPptx, setIsParsingPptx] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedPptx | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const handlePptxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      toast.error('Please upload a .pptx file');
      return;
    }

    setIsParsingPptx(true);
    try {
      const parser = new PptxParser();
      await parser.loadFile(file);
      const data = await parser.parse();
      
      setParsedData(data);
      onParsed(data);
      toast.success(`Parsed ${data.metadata.totalSlides} slides successfully!`);
    } catch (error) {
      console.error('Error parsing PPTX:', error);
      toast.error('Failed to parse PowerPoint file');
    } finally {
      setIsParsingPptx(false);
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !parsedData) return;

    setIsUploadingImages(true);
    try {
      const imageFiles = Array.from(files).sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

      const updatedSlides = parsedData.slides.map((slide, index) => {
        const imageFile = imageFiles[index];
        if (imageFile) {
          return {
            ...slide,
            imageUrl: URL.createObjectURL(imageFile),
          };
        }
        return slide;
      });

      onImagesUploaded(updatedSlides);
      toast.success(`Uploaded ${imageFiles.length} slide images!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploadingImages(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Step 1: Upload PPTX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Step 1: Upload PowerPoint
          </CardTitle>
          <CardDescription>
            Upload your .pptx file to extract slide data and hotspots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pptx-file">PowerPoint File</Label>
              <div className="relative">
                <Input
                  id="pptx-file"
                  type="file"
                  accept=".pptx"
                  onChange={handlePptxUpload}
                  disabled={isParsingPptx}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {isParsingPptx && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing PowerPoint file...
              </div>
            )}

            {parsedData && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <p className="font-medium">✓ Parsed Successfully</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>Total Slides: {parsedData.metadata.totalSlides}</li>
                  <li>Visible: {parsedData.metadata.visibleSlides}</li>
                  <li>Hidden: {parsedData.metadata.hiddenSlides}</li>
                  <li>Videos: {parsedData.metadata.slideTypes.video}</li>
                  <li>GIFs: {parsedData.metadata.slideTypes.gif}</li>
                  <li>Links: {parsedData.metadata.slideTypes.link}</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Upload Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Step 2: Upload Slide Images
          </CardTitle>
          <CardDescription>
            Export slides as PNG from PowerPoint and upload them here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="slide-images">Slide Images (PNG)</Label>
              <div className="relative">
                <Input
                  id="slide-images"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleImagesUpload}
                  disabled={!parsedData || isUploadingImages}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {!parsedData && (
              <p className="text-sm text-muted-foreground">
                Please upload a PowerPoint file first
              </p>
            )}

            {isUploadingImages && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading images...
              </div>
            )}

            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <p className="font-medium">📸 Export Instructions:</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Open PowerPoint</li>
                <li>File → Export → Change File Type</li>
                <li>Select PNG Format</li>
                <li>Export All Slides</li>
                <li>Upload the PNG files here</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
