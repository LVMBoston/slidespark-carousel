// src/lib/shareUtils.ts

export interface ShareData {
  message: string;
  subject: string;
  linkStyle: 'inline' | 'separate';
}

/**
 * Get the current page URL for sharing
 */
function getShareUrl(): string {
  return window.location.href;
}

/**
 * Show a toast notification
 */
function showToast(message: string): void {
  // Dispatch custom event for toast - component should listen for this
  window.dispatchEvent(new CustomEvent('show-toast', { detail: message }));
}

/**
 * Share actions for each platform
 */
export const shareActions: Record<string, (data: ShareData) => void> = {
  SMS: (data) => {
    const url = getShareUrl();
    const body = data.linkStyle === 'inline'
      ? `${data.message} ${url}`
      : `${data.message}\n\n${url}`;
    
    // Use different format for iOS vs Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS
      ? `sms:&body=${encodeURIComponent(body)}`
      : `sms:?body=${encodeURIComponent(body)}`;
    
    window.location.href = smsUrl;
    showToast('Opening Messages...');
  },

  EMAIL: (data) => {
    const url = getShareUrl();
    const body = data.linkStyle === 'inline'
      ? `${data.message} ${url}`
      : `${data.message}\n\n${url}`;
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    showToast('Opening Email...');
  },

  FACEBOOK: () => {
    const url = getShareUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
    showToast('Opening Facebook...');
  },

  TWITTER: (data) => {
    const url = getShareUrl();
    const text = data.message || '';
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'width=600,height=400'
    );
    showToast('Opening Twitter...');
  },

  WHATSAPP: (data) => {
    const url = getShareUrl();
    const text = data.message ? `${data.message} ${url}` : url;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank'
    );
    showToast('Opening WhatsApp...');
  },

  LINKEDIN: () => {
    const url = getShareUrl();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
    showToast('Opening LinkedIn...');
  },

  INSTAGRAM: () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied! Paste in Instagram.');
    }).catch(() => {
      showToast('Could not copy link.');
    });
  },

  BLUESKY: (data) => {
    const url = getShareUrl();
    const text = data.message ? `${data.message} ${url}` : url;
    window.open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`,
      '_blank',
      'width=600,height=600'
    );
    showToast('Opening Bluesky...');
  },

  SHARE: async (data) => {
    const url = getShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.message || 'Check this out',
          url: url,
        });
        showToast('Shared!');
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          showToast('Could not share.');
        }
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {
        showToast('Could not copy link.');
      });
    }
  },
};
