import { Hotspot } from '@/types/pptx';

export const shareUtils = {
  openSMS(hotspot: Hotspot, currentUrl: string) {
    const message = hotspot.metadata.messageLink || hotspot.metadata.message || '';
    const fullMessage = `${message} ${currentUrl}`.trim();
    window.open(`sms:?body=${encodeURIComponent(fullMessage)}`, '_blank');
  },

  openEmail(hotspot: Hotspot, currentUrl: string) {
    const subject = hotspot.metadata.subject || '';
    const body = hotspot.metadata.messageLink || hotspot.metadata.message || '';
    const fullBody = `${body} ${currentUrl}`.trim();
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`,
      '_blank'
    );
  },

  openTwitter(hotspot: Hotspot, currentUrl: string) {
    const message = hotspot.metadata.message || '';
    const text = `${message} ${currentUrl}`.trim();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  },

  openWhatsApp(hotspot: Hotspot, currentUrl: string) {
    const message = hotspot.metadata.message || '';
    const text = `${message} ${currentUrl}`.trim();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  },

  openBluesky(hotspot: Hotspot, currentUrl: string) {
    const message = hotspot.metadata.message || '';
    const text = `${message} ${currentUrl}`.trim();
    window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`, '_blank');
  },

  openFacebook(currentUrl: string) {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      '_blank'
    );
  },

  openLinkedIn(currentUrl: string) {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      '_blank'
    );
  },

  copyToClipboard(currentUrl: string) {
    navigator.clipboard.writeText(currentUrl);
    return true;
  },

  async nativeShare(hotspot: Hotspot, currentUrl: string) {
    const title = hotspot.metadata.title || 'Check this out!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: currentUrl,
        });
        return true;
      } catch (error) {
        console.error('Error sharing:', error);
        return false;
      }
    } else {
      this.copyToClipboard(currentUrl);
      return true;
    }
  },

  handleHotspotClick(hotspot: Hotspot, currentUrl: string): boolean {
    switch (hotspot.type) {
      case 'SMS':
        this.openSMS(hotspot, currentUrl);
        return true;
      case 'EMAIL':
        this.openEmail(hotspot, currentUrl);
        return true;
      case 'TWITTER':
        this.openTwitter(hotspot, currentUrl);
        return true;
      case 'WHATSAPP':
        this.openWhatsApp(hotspot, currentUrl);
        return true;
      case 'BLUESKY':
        this.openBluesky(hotspot, currentUrl);
        return true;
      case 'FACEBOOK':
        this.openFacebook(currentUrl);
        return true;
      case 'LINKEDIN':
        this.openLinkedIn(currentUrl);
        return true;
      case 'INSTAGRAM':
        return this.copyToClipboard(currentUrl);
      case 'SHARE':
        this.nativeShare(hotspot, currentUrl);
        return true;
      default:
        return false;
    }
  },
};
