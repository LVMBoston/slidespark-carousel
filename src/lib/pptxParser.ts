import JSZip from 'jszip';
import { SlideData, SlideType, Hotspot, ParsedPptx, PptxMetadata } from '@/types/pptx';

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

    const slides: SlideData[] = [];
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

      const slide: SlideData = {
        index: slideNumber,
        type: slideType,
        imageUrl: '',
        isHidden,
        hotspots,
        speakerNotes,
      };

      if (slideType === 'video') {
        slide.videoUrl = this.extractUrl(speakerNotes, '[VIDEO]');
      } else if (slideType === 'gif') {
        slide.gifUrl = this.extractUrl(speakerNotes, '[GIF]');
      } else if (slideType === 'link') {
        slide.linkUrl = this.extractUrl(speakerNotes, '[LINK]');
      }

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
    
    if (speakerNotes.includes('[VIDEO]')) return 'video';
    if (speakerNotes.includes('[GIF]')) return 'gif';
    if (speakerNotes.includes('[LINK]')) return 'link';
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
        left: (parseInt(xMatch[1]) / slideWidth) * 100,
        top: (parseInt(yMatch[1]) / slideHeight) * 100,
        width: (parseInt(cxMatch[1]) / slideWidth) * 100,
        height: (parseInt(cyMatch[1]) / slideHeight) * 100,
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

  private generateMetadata(slides: SlideData[]): PptxMetadata {
    const visibleSlides = slides.filter(s => !s.isHidden);
    
    const slideTypes: Record<SlideType, number> = {
      image: 0,
      video: 0,
      gif: 0,
      link: 0,
      documentation: 0,
    };

    visibleSlides.forEach(slide => {
      slideTypes[slide.type]++;
    });

    return {
      totalSlides: slides.length,
      visibleSlides: visibleSlides.length,
      hiddenSlides: slides.length - visibleSlides.length,
      slideTypes,
    };
  }
}
