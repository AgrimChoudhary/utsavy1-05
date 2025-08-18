import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTemplateCache } from '@/hooks/useTemplateCache';
import { useSimpleEventStats } from '@/hooks/useSimpleEventStats';
import { shouldShowWishesForEvent } from '@/utils/templateWishesSupport';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Edit, Settings, MoreVertical, MessageSquare, UserCheck, MessageCircle, Calendar, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestManagement } from '@/components/events/GuestManagement';
import { TemplateFormDispatcher } from '@/components/events/TemplateFormDispatcher';
import WishManagementList from '@/components/events/WishManagementList';

import { ConnectionWarning } from '@/components/ui/connection-warning';
import { StatusBadge } from '@/components/ui/status-badge';
import { Event } from '@/types';
import { format, parseISO } from 'date-fns';
import { MainEventSettingsDialog } from '@/components/events/MainEventSettingsDialog';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const EventManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [activeSetting, setActiveSetting] = useState<'rsvp' | 'message' | 'followup' | 'guest-events'>('rsvp');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeadlineManager, setShowDeadlineManager] = useState(false);
  const [isWishDialogOpen, setIsWishDialogOpen] = useState(false);

  // Get event statistics for new RSVP system
  const { stats: eventStats, refetch: refetchStats } = useSimpleEventStats(eventId);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    // Stats are automatically fetched by the hook
  }, [user, loading, navigate, eventId]);

  // Use template cache for instant access
  const { getTemplateById, preloadTemplates } = useTemplateCache();

  // Preload templates for instant access
  useEffect(() => {
    preloadTemplates();
  }, [preloadTemplates]);

  // Fetch event details with error handling for guest access
  const { data: event, isLoading: eventLoading, refetch, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');
      
      // First try to get the event as host - fetch event without template
      const { data: hostEvent, error: hostError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('host_id', user?.id)
        .single();

      if (!hostError && hostEvent) {
        // Enhance event with cached template for instant access
        const cachedTemplate = getTemplateById(hostEvent.template_id);
        return {
          ...hostEvent,
          template: cachedTemplate
        } as unknown as Event;
      }

      // If not host, check if user is a guest to provide helpful message
      if (hostError && user) {
        const { data: guestCheck } = await supabase
          .from('guests')
          .select('id, custom_guest_id, name')
          .eq('event_id', eventId)
          .eq('mobile_number', user.user_metadata?.mobile_number || '')
          .limit(1)
          .single();

        if (guestCheck) {
          // User is a guest, throw specific error for guest redirection
          throw new Error(`GUEST_ACCESS:${guestCheck.id}`);
        }
      }

      throw hostError;
    },
    enabled: !!eventId && !!user,
  });

  // Handle guest redirection
  useEffect(() => {
    if (eventError?.message?.startsWith('GUEST_ACCESS:')) {
      const guestId = eventError.message.split(':')[1];
      if (guestId && eventId) {
        navigate(`/invite/${eventId}/${guestId}`);
      }
    }
  }, [eventError, navigate, eventId]);

  const handleEditEvent = async (formData: any) => {
    if (!eventId) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          name: formData.name,
          details: formData.details
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event Updated",
        description: "Your event details have been successfully updated.",
      });

      setIsEditing(false);
      refetch(); // Refresh the event data
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update event. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openSettingsWithTab = (tab: 'rsvp' | 'message' | 'followup' | 'guest-events') => {
    setActiveSetting(tab);
    setIsSettingsDialogOpen(true);
    setIsDropdownOpen(false); // Close dropdown when opening settings
  };

  const handleSettingsDialogClose = (open: boolean) => {
    setIsSettingsDialogOpen(open);
    if (!open) {
      // Reset dropdown state when dialog closes
      setIsDropdownOpen(false);
    }
  };

  const scrollToWishManagement = () => {
    setIsDropdownOpen(false);
    const el = document.getElementById('wish-management');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  if (loading || eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user || !eventId) return null;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Event not found</h2>
            <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or you don't have access to it.</p>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const details = event.details as Record<string, any>;

  // Check if current event's template supports wishes functionality
  const showWishManagement = shouldShowWishesForEvent(event, getTemplateById);

  // If in editing mode, show the EventForm
  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <h1 className="text-lg sm:text-xl font-semibold truncate">
                  Edit Event
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TemplateFormDispatcher
              template={event.template || getTemplateById(event.template_id)}
              onSubmit={handleEditEvent}
              onBack={() => setIsEditing(false)}
              isLoading={false}
              initialData={{
                name: event.name,
                details: event.details
              }}
            />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link to="/dashboard">
                <Button variant="ghost" className="hover:bg-gray-100 transition-colors">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline font-medium">Dashboard</span>
                </Button>
              </Link>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  Manage Event
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Configure and customize your event settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button 
                onClick={() => setIsEditing(true)} 
                size="sm"
                className="font-medium shadow-sm hover:shadow transition-all"
                disabled={!event.template && !getTemplateById(event.template_id)}
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Customize</span>
              </Button>
              
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="shadow-sm hover:shadow hover:border-gray-400 transition-all"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50">
                  <DropdownMenuItem 
                    onClick={() => openSettingsWithTab('rsvp')}
                    className="cursor-pointer"
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    <span>RSVP Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => openSettingsWithTab('message')}
                    className="cursor-pointer"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Invitation Message</span>
                  </DropdownMenuItem>
                  {event?.rsvp_config && 
                   typeof event.rsvp_config === 'object' && 
                   'type' in event.rsvp_config && 
                   event.rsvp_config.type === 'detailed' && (
                    <DropdownMenuItem 
                      onClick={() => openSettingsWithTab('followup')}
                      className="cursor-pointer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>FollowUp Message</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => openSettingsWithTab('guest-events')}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Guest Event Access</span>
                  </DropdownMenuItem>
                  {showWishManagement && (
                    <DropdownMenuItem 
                      onClick={() => { setIsWishDialogOpen(true); setIsDropdownOpen(false); }}
                      className="cursor-pointer"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wish Management</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <MainEventSettingsDialog 
                event={event} 
                isOpen={isSettingsDialogOpen}
                onOpenChange={handleSettingsDialogClose}
                initialActiveSetting={activeSetting}
              >
                <span></span>
              </MainEventSettingsDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Wish Management Dialog - Only show for templates that support wishes */}
      {showWishManagement && (
        <Dialog open={isWishDialogOpen} onOpenChange={setIsWishDialogOpen}>
          <DialogContent aria-describedby="wish-dialog-description" className="w-[90vw] max-w-3xl h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Wish Management</DialogTitle>
              <DialogDescription id="wish-dialog-description">
                Review, approve, and delete guest wishes for this event.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1">
              <WishManagementList eventId={eventId} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Event Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{event.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  Using the "{event.template?.name || getTemplateById(event.template_id)?.name || 'Loading template...'}" template
                </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                {(details?.date || details?.wedding_date) && (
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-500 mb-1">Date</span>
                    <p>{format(parseISO(details.date || details.wedding_date), 'PPP')}</p>
                  </div>
                )}
                {(details?.time || details?.wedding_time) && (
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-500 mb-1">Time</span>
                    <p>{details.time || details.wedding_time}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
            <Card className="shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-semibold text-muted-foreground">{eventStats.pending}</div>
                <div className="mt-1 text-xs md:text-sm flex items-center justify-center gap-1">
                  <StatusBadge status="pending" />
                  <span className="hidden md:inline">Pending</span>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-semibold text-yellow-600">{eventStats.viewed}</div>
                <div className="mt-1 text-xs md:text-sm flex items-center justify-center gap-1">
                  <StatusBadge status="viewed" />
                  <span className="hidden md:inline">Viewed</span>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-semibold text-green-600">{eventStats.accepted}</div>
                <div className="mt-1 text-xs md:text-sm flex items-center justify-center gap-1">
                  <StatusBadge status="accepted" />
                  <span className="hidden md:inline">Accepted</span>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-3 md:p-4 text-center">
                <div className="text-xl md:text-2xl font-semibold text-blue-600">{eventStats.submitted}</div>
                <div className="mt-1 text-xs md:text-sm flex items-center justify-center gap-1">
                  <StatusBadge status="submitted" />
                  <span className="hidden md:inline">Submitted</span>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Guest List Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <h2 className="text-xl font-semibold">Guest List</h2>
            </div>
            <GuestManagement eventId={eventId} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default EventManagement;
