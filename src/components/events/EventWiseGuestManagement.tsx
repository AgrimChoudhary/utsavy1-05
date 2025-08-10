import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar, Users, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Guest } from '@/types';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DialogFooter } from '@/components/ui/dialog';

interface EventWiseGuestManagementProps {
  eventId: string;
  onClose: () => void;
}

const GUESTS_PER_PAGE = 10;

export const EventWiseGuestManagement = ({ eventId, onClose }: EventWiseGuestManagementProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [isApplyingToAll, setIsApplyingToAll] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch guests for this event
  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Guest[];
    },
  });

  // Fetch guest event access settings
  const { data: guestEventAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['guest-event-access', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_event_access')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      return data;
    },
  });

  // Filter guests based on search
  const filteredGuests = guests?.filter(guest => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      guest.name.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil((filteredGuests?.length || 0) / GUESTS_PER_PAGE);
  const startIndex = (currentPage - 1) * GUESTS_PER_PAGE;
  const endIndex = startIndex + GUESTS_PER_PAGE;
  const currentGuests = filteredGuests?.slice(startIndex, endIndex);

  // Handle page changes
  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Get events from event details
  const eventDetails = event?.details as Record<string, any> || {};
  const events = eventDetails.events || [];

  // Check if a guest has access to a specific event
  const hasAccess = (guestId: string, eventIndex: number) => {
    if (!guestEventAccess) return true; // Default to true if data not loaded yet
    
    const accessRecord = guestEventAccess.find(
      record => record.guest_id === guestId && 
                record.event_detail_id === eventIndex.toString() &&
                record.event_id === eventId
    );
    
    return accessRecord ? accessRecord.can_access : true;
  };

  // Update guest event access mutation
  const updateAccessMutation = useMutation({
    mutationFn: async ({ 
      guestId, 
      eventIndex, 
      canAccess 
    }: { 
      guestId: string; 
      eventIndex: number; 
      canAccess: boolean 
    }) => {
      const { data, error } = await supabase
        .from('guest_event_access')
        .upsert({
          guest_id: guestId,
          event_detail_id: eventIndex.toString(),
          event_id: eventId,
          can_access: canAccess
        }, {
          onConflict: 'guest_id,event_detail_id,event_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-event-access', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating access",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Bulk update access for multiple guests
  const bulkUpdateAccessMutation = useMutation({
    mutationFn: async ({ 
      guestIds, 
      eventIndex, 
      canAccess 
    }: { 
      guestIds: string[]; 
      eventIndex: number; 
      canAccess: boolean 
    }) => {
      // Create an array of records to upsert
      const records = guestIds.map(guestId => ({
        guest_id: guestId,
        event_detail_id: eventIndex.toString(),
        event_id: eventId,
        can_access: canAccess
      }));

      const { data, error } = await supabase
        .from('guest_event_access')
        .upsert(records, {
          onConflict: 'guest_id,event_detail_id,event_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-event-access', eventId] });
      setSelectedGuests([]);
      toast({
        title: "Access updated",
        description: `Updated access for ${selectedGuests.length} guests`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating access",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Apply access setting to all events for selected guests
  const applyToAllEventsMutation = useMutation({
    mutationFn: async ({ 
      guestIds, 
      canAccess 
    }: { 
      guestIds: string[]; 
      canAccess: boolean 
    }) => {
      // Create an array of records to upsert for all events
      const records = [];
      
      for (const guestId of guestIds) {
        for (let i = 0; i < events.length; i++) {
          records.push({
            guest_id: guestId,
            event_detail_id: i.toString(),
            event_id: eventId,
            can_access: canAccess
          });
        }
      }

      const { data, error } = await supabase
        .from('guest_event_access')
        .upsert(records, {
          onConflict: 'guest_id,event_detail_id,event_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-event-access', eventId] });
      setSelectedGuests([]);
      setIsApplyingToAll(false);
      toast({
        title: "Access updated for all events",
        description: `Updated access for ${selectedGuests.length} guests across all events`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating access",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleToggleAccess = (guestId: string, eventIndex: number) => {
    const currentAccess = hasAccess(guestId, eventIndex);
    updateAccessMutation.mutate({
      guestId,
      eventIndex,
      canAccess: !currentAccess
    });
  };

  const handleBulkToggleAccess = (eventIndex: number, canAccess: boolean) => {
    if (selectedGuests.length === 0) {
      toast({
        title: "No guests selected",
        description: "Please select at least one guest to update access",
        variant: "destructive"
      });
      return;
    }

    bulkUpdateAccessMutation.mutate({
      guestIds: selectedGuests,
      eventIndex,
      canAccess
    });
  };

  const handleApplyToAllEvents = (canAccess: boolean) => {
    if (selectedGuests.length === 0) {
      toast({
        title: "No guests selected",
        description: "Please select at least one guest to update access",
        variant: "destructive"
      });
      return;
    }

    applyToAllEventsMutation.mutate({
      guestIds: selectedGuests,
      canAccess
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex-1 text-xs text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredGuests?.length || 0)} of{" "}
          {filteredGuests?.length || 0} guests
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="hidden sm:inline-flex"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => goToPage(page)}
                className={`w-8 h-8 ${
                  isMobile && Math.abs(currentPage - page) > 1 ? "hidden" : ""
                }`}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="hidden sm:inline-flex"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (eventLoading || guestsLoading || accessLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event-wise Guest Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guest access settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event-wise Guest Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
          <p className="text-gray-600 mb-4">
            You need to add events to your invitation before you can manage guest access.
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!guests || guests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event-wise Guest Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Guests Found</h3>
          <p className="text-gray-600 mb-4">
            You need to add guests to your event before you can manage their access.
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event-wise Guest Management</span>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>Control which guests can see which events in their invitation. This allows you to customize the invitation for different groups of guests.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and controls section */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex-1 min-w-[200px] max-w-xl flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Event selection tabs */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {events.map((event: any, index: number) => (
              <Button
                key={index}
                variant={selectedEventIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEventIndex(index)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{event.name}</span>
              </Button>
            ))}
          </div>

          {/* Selected event info */}
          {selectedEventIndex !== null && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">{events[selectedEventIndex].name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span> {events[selectedEventIndex].date}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {events[selectedEventIndex].time}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Venue:</span> {events[selectedEventIndex].venue}
                </div>
              </div>
              
              {/* Bulk actions for selected event */}
              {selectedGuests.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex flex-wrap gap-3 items-center">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedGuests.length} guest{selectedGuests.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border-gray-300"
                      onClick={() => handleBulkToggleAccess(selectedEventIndex, true)}
                    >
                      Grant Access
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border-gray-300"
                      onClick={() => handleBulkToggleAccess(selectedEventIndex, false)}
                    >
                      Revoke Access
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border-gray-300"
                      onClick={() => setIsApplyingToAll(true)}
                    >
                      Apply to All Events
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Apply to all events confirmation */}
          {isApplyingToAll && selectedGuests.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Apply to All Events</h4>
              <p className="text-sm text-yellow-700 mb-4">
                This will update access for {selectedGuests.length} selected guest{selectedGuests.length > 1 ? 's' : ''} across all {events.length} events.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsApplyingToAll(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApplyToAllEvents(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Grant Access to All
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApplyToAllEvents(false)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Revoke Access to All
                </Button>
              </div>
            </div>
          )}

          {/* Guest list */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        currentGuests?.length > 0 &&
                        selectedGuests.length === currentGuests?.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGuests(currentGuests?.map(g => g.id) || []);
                        } else {
                          setSelectedGuests([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-xs">Guest Name</TableHead>
                  {selectedEventIndex !== null && (
                    <TableHead className="text-center text-xs">Access to {events[selectedEventIndex].name}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentGuests?.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGuests.includes(guest.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedGuests([...selectedGuests, guest.id]);
                          } else {
                            setSelectedGuests(selectedGuests.filter(id => id !== guest.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-xs">{guest.name}</TableCell>
                    {selectedEventIndex !== null && (
                      <TableCell className="text-center">
                        <Checkbox
                          checked={hasAccess(guest.id, selectedEventIndex)}
                          onCheckedChange={() => handleToggleAccess(guest.id, selectedEventIndex)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {currentGuests?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={selectedEventIndex !== null ? 3 : 2} className="text-center py-8">
                      <p className="text-gray-500">No guests found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {renderPagination()}
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </CardContent>
    </Card>
  );
};