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

export interface SlideData {
  index: number;
  type: SlideType;
  imageUrl: string;
  mediaUrl?: string;
  videoId?: string;
  linkUrl?: string;
  hotspots: Hotspot[];
  speakerNotes?: string;
  isHidden: boolean;
  downloadFiles: DownloadFile[];
}
