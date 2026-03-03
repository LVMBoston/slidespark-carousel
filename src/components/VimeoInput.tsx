import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Video } from 'lucide-react';
import { toast } from 'sonner';
import { SlideData } from '@/types/pptx';

interface VimeoInputProps {
  onSlideCreated: (slide: SlideData) => void;
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

export const VimeoInput = ({ onSlideCreated }: VimeoInputProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractVimeoId(url.trim());
    if (!videoId) {
      toast.error('Please enter a valid Vimeo URL');
      return;
    }

    const slide: SlideData = {
      index: 1,
      slideType: 'vimeo',
      type: 'vimeo',
      imageFile: '',
      imageUrl: '',
      videoId,
      mediaUrl: `https://player.vimeo.com/video/${videoId}`,
      hotspots: [],
      isHidden: false,
      downloadFiles: [],
    };

    onSlideCreated(slide);
    setUrl('');
    toast.success('Vimeo video added as a slide');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Add Vimeo Video
        </CardTitle>
        <CardDescription>
          Paste a Vimeo link to add it as a slide in the carousel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
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
        </form>
      </CardContent>
    </Card>
  );
};
