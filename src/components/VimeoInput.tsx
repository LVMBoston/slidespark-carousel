import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video } from 'lucide-react';
import { toast } from 'sonner';
import { SlideData } from '@/types/slides';

interface VimeoInputProps {
  slides: SlideData[];
  onSlideInserted: (slide: SlideData, afterIndex: number | null) => void;
}

const extractVimeoId = (url: string): string | null => {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const VimeoInput = ({ slides, onSlideInserted }: VimeoInputProps) => {
  const [url, setUrl] = useState('https://vimeo.com/1135129391');
  const [afterSlide, setAfterSlide] = useState<string>('end');

  const visibleSlides = slides.filter(s => !s.isHidden);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVimeoId(url.trim());
    if (!videoId) {
      toast.error('Please enter a valid Vimeo URL');
      return;
    }

    const slide: SlideData = {
      index: 1,
      type: 'vimeo',
      imageUrl: '',
      videoId,
      mediaUrl: `https://player.vimeo.com/video/${videoId}`,
      hotspots: [],
      isHidden: false,
      downloadFiles: [],
    };

    const insertAfter = afterSlide === 'end' ? null : parseInt(afterSlide, 10);
    onSlideInserted(slide, insertAfter);
    setUrl('');
    toast.success('Vimeo video inserted');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Add Vimeo Video
        </CardTitle>
        <CardDescription>
          Paste a Vimeo link and choose where to insert it in the carousel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="vimeo-url" className="sr-only">Vimeo URL</Label>
              <Input
                id="vimeo-url"
                type="url"
                placeholder="https://vimeo.com/123456789"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <Button type="submit">Add</Button>
          </div>
          {visibleSlides.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="insert-position" className="text-sm whitespace-nowrap">
                Insert after:
              </Label>
              <Select value={afterSlide} onValueChange={setAfterSlide}>
                <SelectTrigger id="insert-position" className="w-full">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {visibleSlides.map((slide, i) => (
                    <SelectItem key={slide.index} value={String(i)}>
                      Slide {i + 1}{slide.type !== 'image' ? ` (${slide.type})` : ''}
                    </SelectItem>
                  ))}
                  <SelectItem value="end">At the end</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
