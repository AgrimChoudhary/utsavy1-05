
import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventCardProps {
  title: string;
  date: string;
  time: string;
  venue: string;
  icon: React.ReactNode;
  googleMapsUrl?: string;
}

const EventCard: React.FC<EventCardProps> = ({ title, date, time, venue, icon, googleMapsUrl }) => {
  return (
    <div className="bg-maroon/50 p-6 rounded-lg gold-border flex items-start gap-4">
      <div className="bg-gold-light p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="font-cormorant text-xl gold-text font-bold">{title}</h3>
        <p className="text-cream">{date} at {time}</p>
        <p className="text-cream/80">{venue}</p>
        {googleMapsUrl && (
          <Button asChild variant="link" className="p-0 h-auto text-gold-light hover:text-gold-dark">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-4 h-4 mr-1" /> View Map <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
