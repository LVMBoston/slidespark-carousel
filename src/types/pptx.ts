export type SlideType = 'image' | 'video' | 'gif' | 'link' | 'documentation';

export interface Hotspot {
  type: 'SMS' | 'EMAIL' | 'TWITTER' | 'WHATSAPP' | 'BLUESKY' | 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'SHARE';
  left: number;
  top: number;
  width: number;
  height: number;
  metadata: {
    message?: string;
    messageLink?: string;
    subject?: string;
    title?: string;
  };
}

export interface SlideData {
  index: number;
  type: SlideType;
  imageUrl: string;
  videoUrl?: string;
  gifUrl?: string;
  linkUrl?: string;
  hotspots: Hotspot[];
  speakerNotes?: string;
  isHidden: boolean;
}

export interface PptxMetadata {
  totalSlides: number;
  visibleSlides: number;
  hiddenSlides: number;
  slideTypes: Record<SlideType, number>;
}

export interface ParsedPptx {
  slides: SlideData[];
  metadata: PptxMetadata;
}
