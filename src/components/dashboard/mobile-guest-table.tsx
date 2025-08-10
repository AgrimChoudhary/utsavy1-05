import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Phone, Eye, Edit3, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Guest } from '@/types';

interface MobileGuestTableProps {
  guests: Guest[];
  onGuestAction: (guestId: string, action: 'view' | 'edit' | 'call' | 'delete') => void;
  isLoading?: boolean;
}

export const MobileGuestTable: React.FC<MobileGuestTableProps> = ({
  guests,
  onGuestAction,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 md:hidden">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-2 mt-3">
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
      <div className="md:hidden text-center py-8 text-gray-500">
        <p>No guests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {guests.map((guest) => (
        <Card key={guest.id} className="p-3 active:bg-gray-50 transition-colors">
          <CardContent className="p-0">
            {/* Guest Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {guest.name}
                </h4>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {guest.mobile_number}
                </p>
                {guest.custom_guest_id && (
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    ID: {guest.custom_guest_id}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={guest.accepted && guest.rsvp_data ? 'submitted' : guest.accepted ? 'accepted' : guest.viewed ? 'viewed' : 'pending'} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onGuestAction(guest.id, 'view')}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGuestAction(guest.id, 'edit')}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Guest
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onGuestAction(guest.id, 'call')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call Guest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Timestamp */}
            {(guest.accepted_at || guest.viewed_at) && (
              <p className="text-xs text-gray-500 mb-3">
                Updated: {new Date(guest.accepted_at || guest.viewed_at || '').toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-8"
                onClick={() => onGuestAction(guest.id, 'view')}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-8"
                onClick={() => onGuestAction(guest.id, 'edit')}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>

            {/* Status Indicator */}
            {guest.accepted && guest.rsvp_data && (
              <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                ✓ RSVP Details Submitted
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};