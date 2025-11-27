import JSZip from 'jszip';
import { ParsedSlide, SlideType, Hotspot, ParsedPptx, PptxMetadata, DownloadFile } from '@/types/pptx';

export class PptxParser {
  private zip: JSZip | null = null;

  async loadFile(file: File): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.zip = await JSZip.loadAsync(arrayBuffer);
  }

  async parse(): Promise<ParsedPptx> {
    if (!this.zip) {
      throw new Error('No PPTX file loaded');
    }

    const slides: ParsedSlide[] = [];
    const slideFiles = Object.keys(this.zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideContent = await this.zip.file(slideFile)?.async('text');
      if (!slideContent) continue;

      const slideNumber = i + 1;
      const isHiddenInPpt = slideContent.includes('show="0"');
      
      const speakerNotes = await this.getSpeakerNotes(slideNumber);
      const slideType = this.detectSlideType(speakerNotes);
      const isDocumentation = speakerNotes?.includes('[DOCUMENTATION]');
      const isHidden = isHiddenInPpt || isDocumentation;

      const hotspots = await this.extractHotspots(slideContent, slideNumber);
      const downloadFiles = this.extractDownloadFiles(speakerNotes);

      const slide: ParsedSlide = {
        index: slideNumber,
        slideType: slideType,
        imageFile: '',
        isHidden,
        hotspots,
        speakerNotes: speakerNotes || '',
        downloadFiles,
        mediaUrl: this.extractMediaUrl(speakerNotes, slideType),
        videoId: this.extractVideoId(speakerNotes, slideType),
        linkUrl: slideType === 'link' ? this.extractUrl(speakerNotes, '[LINK]') : undefined,
      };

      slides.push(slide);
    }

    const metadata = this.generateMetadata(slides);

    return { slides, metadata };
  }

  private async getSpeakerNotes(slideNumber: number): Promise<string> {
    if (!this.zip) return '';

    const notesFile = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
    const notesContent = await this.zip.file(notesFile)?.async('text');
    
    if (!notesContent) return '';

    const textMatch = notesContent.match(/<a:t>(.*?)<\/a:t>/g);
    if (!textMatch) return '';

    return textMatch
      .map(match => match.replace(/<\/?a:t>/g, ''))
      .join(' ')
      .trim();
  }

  private detectSlideType(speakerNotes?: string): SlideType {
    if (!speakerNotes) return 'image';
    
    if (speakerNotes.includes('[VIMEO]')) return 'vimeo';
    if (speakerNotes.includes('[YOUTUBE]')) return 'youtube';
    if (speakerNotes.includes('[VIDEO]')) return 'video';
    if (speakerNotes.includes('[GIF]')) return 'gif';
    if (speakerNotes.includes('[LINK]')) return 'link';
    if (speakerNotes.includes('[DOWNLOAD]')) return 'download';
    if (speakerNotes.includes('[DOCUMENTATION]')) return 'documentation';
    
    return 'image';
  }

  private extractUrl(speakerNotes?: string, prefix?: string): string | undefined {
    if (!speakerNotes || !prefix) return undefined;
    
    const regex = new RegExp(`${prefix.replace(/[[\]]/g, '\\$&')}\\s+(https?://\\S+)`);
    const match = speakerNotes.match(regex);
    
    return match?.[1];
  }

  private async extractHotspots(slideContent: string, slideNumber: number): Promise<Hotspot[]> {
    const hotspots: Hotspot[] = [];
    
    const shapeMatches = slideContent.matchAll(/<p:sp>(.*?)<\/p:sp>/gs);
    
    for (const match of shapeMatches) {
      const shapeXml = match[1];
      
      const nameMatch = shapeXml.match(/<p:cNvPr[^>]*name="([^"]*)"[^>]*>/);
      const shapeName = nameMatch?.[1]?.toUpperCase();
      
      if (!shapeName || !this.isHotspotType(shapeName)) continue;

      const altTextMatch = shapeXml.match(/<p:cNvPr[^>]*descr="([^"]*)"/);
      const altText = altTextMatch?.[1] || '';

      const xMatch = shapeXml.match(/<a:off[^>]*x="(\d+)"/);
      const yMatch = shapeXml.match(/<a:off[^>]*y="(\d+)"/);
      const cxMatch = shapeXml.match(/<a:ext[^>]*cx="(\d+)"/);
      const cyMatch = shapeXml.match(/<a:ext[^>]*cy="(\d+)"/);

      if (!xMatch || !yMatch || !cxMatch || !cyMatch) continue;

      const slideWidth = 9144000;
      const slideHeight = 6858000;

      const hotspot: Hotspot = {
        type: shapeName as Hotspot['type'],
        xPercent: (parseInt(xMatch[1]) / slideWidth) * 100,
        yPercent: (parseInt(yMatch[1]) / slideHeight) * 100,
        widthPercent: (parseInt(cxMatch[1]) / slideWidth) * 100,
        heightPercent: (parseInt(cyMatch[1]) / slideHeight) * 100,
        metadata: this.parseAltText(altText),
      };

      hotspots.push(hotspot);
    }

    return hotspots;
  }

  private isHotspotType(name: string): boolean {
    const types = ['SMS', 'EMAIL', 'TWITTER', 'WHATSAPP', 'BLUESKY', 'FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'SHARE'];
    return types.includes(name);
  }

  private parseAltText(altText: string): Hotspot['metadata'] {
    const metadata: Hotspot['metadata'] = {};

    const messageMatch = altText.match(/\[MESSAGE\]\s*"([^"]*)"/);
    if (messageMatch) metadata.message = messageMatch[1];

    const messageLinkMatch = altText.match(/\[MESSAGE LINK\]\s*"([^"]*)"/);
    if (messageLinkMatch) metadata.messageLink = messageLinkMatch[1];

    const subjectMatch = altText.match(/\[SUBJECT\]\s*"([^"]*)"/);
    if (subjectMatch) metadata.subject = subjectMatch[1];

    const titleMatch = altText.match(/\[MESSAGE\]\s*"([^"]*)"/);
    if (titleMatch) metadata.title = titleMatch[1];

    return metadata;
  }

  private extractMediaUrl(speakerNotes?: string, slideType?: SlideType): string | undefined {
    if (!speakerNotes) return undefined;
    
    if (slideType === 'video') {
      return this.extractUrl(speakerNotes, '[VIDEO]');
    } else if (slideType === 'gif') {
      return this.extractUrl(speakerNotes, '[GIF]');
    }
    
    return undefined;
  }

  private extractVideoId(speakerNotes?: string, slideType?: SlideType): string | undefined {
    if (!speakerNotes) return undefined;
    
    if (slideType === 'vimeo') {
      const vimeoMatch = speakerNotes.match(/\[VIMEO\]\s+(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
      return vimeoMatch?.[1];
    } else if (slideType === 'youtube') {
      const youtubeMatch = speakerNotes.match(/\[YOUTUBE\]\s+(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      return youtubeMatch?.[1];
    }
    
    return undefined;
  }

  private extractDownloadFiles(speakerNotes?: string): DownloadFile[] {
    if (!speakerNotes) return [];
    
    const files: DownloadFile[] = [];
    const fileMatches = speakerNotes.matchAll(/\[FILE\]\s+"([^"]+)"\s+"([^"]+)"/g);
    
    for (const match of fileMatches) {
      files.push({
        path: match[1],
        label: match[2],
      });
    }
    
    return files;
  }

  private generateMetadata(slides: ParsedSlide[]): PptxMetadata {
    const visibleSlides = slides.filter(s => !s.isHidden);
    
    const slideTypes: Record<SlideType, number> = {
      image: 0,
      video: 0,
      gif: 0,
      link: 0,
      documentation: 0,
      download: 0,
      vimeo: 0,
      youtube: 0,
    };

    visibleSlides.forEach(slide => {
      slideTypes[slide.slideType]++;
    });

    return {
      totalSlides: slides.length,
      visibleSlides: visibleSlides.length,
      hiddenSlides: slides.length - visibleSlides.length,
      slideTypes,
    };
  }
}
