import { Hotspot } from '@/types/pptx';
import { shareUtils } from '@/lib/shareUtils';
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
import { toast } from 'sonner';

interface HotspotOverlayProps {
  hotspots: Hotspot[];
  currentUrl: string;
}

const HotspotIcon = ({ type }: { type: Hotspot['type'] }) => {
  const className = "w-5 h-5";
  
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

export const HotspotOverlay = ({ hotspots, currentUrl }: HotspotOverlayProps) => {
  const handleClick = (hotspot: Hotspot) => {
    const success = shareUtils.handleHotspotClick(hotspot, currentUrl);
    
    if (hotspot.type === 'INSTAGRAM' && success) {
      toast.success('URL copied to clipboard!');
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
            left: `${hotspot.left}%`,
            top: `${hotspot.top}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
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
