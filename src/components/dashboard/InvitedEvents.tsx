import { Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Clock, ThumbsUp, ThumbsDown, Users, MoreHorizontal, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { useState, useMemo } from 'react';

interface InvitedEventsProps {
  events: Event[];
}

export const InvitedEvents = ({ events }: InvitedEventsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6; // Fixed 6 cards per page

  // Calculate paginated events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    return events.slice(startIndex, endIndex);
  }, [events, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(events.length / eventsPerPage);

  if (events.length === 0) {
    return (
      <Card className="text-center py-12 border-dashed border-2">
        <CardContent className="flex flex-col items-center p-6">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-indigo-300" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No invitations found</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            When you're invited to events, they will appear here.
          </p>
          <Button variant="outline" disabled className="opacity-60">
            Waiting for invitations
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedEvents.map((event) => {
          const details = event.details as Record<string, any>;
          const eventDate = details?.wedding_date || details?.date;
          const formattedDate = eventDate ? format(new Date(eventDate), 'PPP') : 'No date set';
          
          return (
            <Card key={event.id} className="bg-white hover:shadow-sm transition-all duration-300 rounded-xl">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                  <div className="text-sm text-gray-500">
                    {event.template?.name || 'Custom'}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 space-y-3">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{details?.wedding_date || details?.date ? format(new Date(details?.wedding_date || details?.date), 'PPP') : 'No date set'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm truncate">{details?.venue_address || details?.venue || 'No venue set'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">{Array.isArray(event.guests) ? event.guests.length : 0} guests</span>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 pb-4 px-6">
                <Link to={`/invite/${event.custom_event_id || event.id}/${event.custom_guest_id_for_user || event.guest_id_for_user}`} className="w-full">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Invitation
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Show pagination only if there are more than 6 events */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <div className="text-center text-sm text-gray-500 mt-4">
            Showing {Math.min(eventsPerPage, events.length - (currentPage - 1) * eventsPerPage)} of {events.length} events
          </div>
        </div>
      )}
    </div>
  );
};