export type SlideType = 'image' | 'video' | 'gif' | 'link' | 'documentation' | 'download' | 'vimeo' | 'youtube';

export type HotspotType = 'SMS' | 'EMAIL' | 'TWITTER' | 'WHATSAPP' | 'BLUESKY' | 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'SHARE';

export interface Hotspot {
  type: HotspotType;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  metadata: {
    message?: string;
    messageLink?: string;
    subject?: string;
    title?: string;
    linkStyle?: 'inline' | 'separate';
  };
}

export interface DownloadFile {
  path: string;
  label: string;
}

export interface ParsedSlide {
  index: number;
  slideType: SlideType;
  imageFile: string;
  mediaUrl?: string;
  videoId?: string;
  linkUrl?: string;
  hotspots: Hotspot[];
  speakerNotes?: string;
  isHidden: boolean;
  downloadFiles: DownloadFile[];
}

// Legacy compatibility - map old SlideData to ParsedSlide
export interface SlideData extends ParsedSlide {
  type: SlideType;
  imageUrl: string;
}

export interface PptxMetadata {
  totalSlides: number;
  visibleSlides: number;
  hiddenSlides: number;
  slideTypes: Record<SlideType, number>;
}

export interface ParsedPptx {
  slides: ParsedSlide[];
  metadata: PptxMetadata;
}
