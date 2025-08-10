import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Eye, Edit3 } from 'lucide-react';
import { Guest } from '@/types';

interface GuestStatusCardsProps {
  guests: Guest[];
  onGuestAction: (guestId: string, action: 'view' | 'edit' | 'call') => void;
  isLoading?: boolean;
}

export const GuestStatusCards: React.FC<GuestStatusCardsProps> = ({
  guests,
  onGuestAction,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded flex-1"></div>
              <div className="h-8 bg-gray-200 rounded flex-1"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (guests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No guests found for the current filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {guests.map((guest) => (
        <Card 
          key={guest.id} 
          className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onGuestAction(guest.id, 'view')}
        >
          <CardContent className="p-0">
            {/* Guest Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {guest.name}
                </h4>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {guest.mobile_number}
                </p>
              </div>
              <StatusBadge status={guest.accepted && guest.rsvp_data ? 'submitted' : guest.accepted ? 'accepted' : guest.viewed ? 'viewed' : 'pending'} />
            </div>

            {/* Guest Details */}
            <div className="space-y-2 mb-4">
              {(guest.accepted_at || guest.viewed_at) && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(guest.accepted_at || guest.viewed_at || '').toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              
              {guest.custom_guest_id && (
                <p className="text-xs text-gray-500 font-mono">
                  ID: {guest.custom_guest_id}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onGuestAction(guest.id, 'view');
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onGuestAction(guest.id, 'edit');
                }}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>

            {/* RSVP Data Preview */}
            {guest.accepted && guest.rsvp_data && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-green-600 font-medium">
                  ✓ RSVP Details Submitted
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};