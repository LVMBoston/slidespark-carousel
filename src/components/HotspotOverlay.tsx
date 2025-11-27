import { Hotspot } from '@/types/pptx';
import { shareActions, ShareData } from '@/lib/shareUtils';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Mail, 
  Twitter, 
  MessageCircle, 
  Facebook, 
  Linkedin, 
  Instagram, 
  Share2,
  Cloud
} from 'lucide-react';

interface HotspotOverlayProps {
  hotspots: Hotspot[];
}

const HotspotIcon = ({ type }: { type: Hotspot['type'] }) => {
  const className = "w-4 h-4";
  
  switch (type) {
    case 'SMS':
      return <MessageSquare className={className} />;
    case 'EMAIL':
      return <Mail className={className} />;
    case 'TWITTER':
      return <Twitter className={className} />;
    case 'WHATSAPP':
      return <MessageCircle className={className} />;
    case 'BLUESKY':
      return <Cloud className={className} />;
    case 'FACEBOOK':
      return <Facebook className={className} />;
    case 'LINKEDIN':
      return <Linkedin className={className} />;
    case 'INSTAGRAM':
      return <Instagram className={className} />;
    case 'SHARE':
      return <Share2 className={className} />;
    default:
      return <Share2 className={className} />;
  }
};

export const HotspotOverlay = ({ hotspots }: HotspotOverlayProps) => {
  const handleClick = (hotspot: Hotspot) => {
    const shareData: ShareData = {
      message: hotspot.metadata.message || '',
      subject: hotspot.metadata.subject || '',
      linkStyle: hotspot.metadata.linkStyle || 'inline',
    };

    const action = shareActions[hotspot.type];
    if (action) {
      action(shareData);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hotspots.map((hotspot, index) => (
        <Button
          key={index}
          variant="secondary"
          size="icon"
          className="absolute pointer-events-auto opacity-90 hover:opacity-100 transition-opacity shadow-lg"
          style={{
            left: `${hotspot.xPercent}%`,
            top: `${hotspot.yPercent}%`,
            width: `${hotspot.widthPercent}%`,
            height: `${hotspot.heightPercent}%`,
          }}
          onClick={() => handleClick(hotspot)}
          title={`Share via ${hotspot.type}`}
        >
          <HotspotIcon type={hotspot.type} />
        </Button>
      ))}
    </div>
  );
};
