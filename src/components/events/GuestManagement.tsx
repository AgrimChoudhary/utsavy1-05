import { useState, useEffect, useRef, forwardRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, UserPlus, Share2, Copy, Pencil, User, Clock, Search, Filter, Download, Upload, MoreVertical, CheckCircle2, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MessageSquare, ClipboardList, MessageCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Guest, RSVPField } from '@/types';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from '@/hooks/use-is-mobile';
import { CountryCodeSelect } from '@/components/auth/CountryCodeSelect';
import { ExportRSVPDialog } from '@/components/events/ExportRSVPDialog';
import { fetchRSVPFields } from '@/utils/rsvpExportUtils';

interface GuestManagementProps {
  eventId: string;
}

const GUESTS_PER_PAGE = 10;

// Custom tooltip component with no delay
const InstantTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <TooltipProvider>
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const GuestManagement = ({ eventId }: GuestManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestMobileNumber, setNewGuestMobileNumber] = useState('');
  const [newGuestCountryCode, setNewGuestCountryCode] = useState('+91');
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestMobileNumber, setEditGuestMobileNumber] = useState('');
  const [editGuestCountryCode, setEditGuestCountryCode] = useState('+91');
  const [editGuestId, setEditGuestId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'viewed' | 'accepted' | 'pending' | 'submitted'>('all');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Add real-time updates
  const { isConnected } = useRealTimeUpdates(eventId);

  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('guests');

  // Add real-time subscription for guest changes
  useEffect(() => {
    const subscription = supabase
      .channel('guests-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'guests',
        filter: `event_id=eq.${eventId}`
      }, () => {
        // Invalidate both guests and events queries
        queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, queryClient]);

  // Fetch event details to get custom_event_id
  const { data: eventData } = useQuery({
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
    enabled: !!eventId,
  });


  // Fetch guests for this event
  const { data: guests, isLoading } = useQuery({
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

  // Fetch RSVP fields for this event
  const { data: rsvpFields = [] } = useQuery({
    queryKey: ['rsvp-fields', eventId],
    queryFn: () => fetchRSVPFields(eventId),
  });

  // Filter guests by status only (removing search functionality)
  const filteredGuests = guests?.filter(guest => {
    // Apply status filter
    switch (selectedFilter) {
      case 'viewed':
        if (!guest.viewed || guest.accepted) return false;
        break;
      case 'accepted':
        if (!guest.accepted) return false;
        break;
      case 'pending':
        if (guest.viewed || guest.accepted) return false;
        break;
      case 'submitted':
        if (!(guest.accepted && guest.rsvp_data && Object.keys(guest.rsvp_data).length > 0)) return false;
        break;
    }
    return true;
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

  // Reset to first page when filter changes (removing search dependency)
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  // Add guest mutation
  const addGuestMutation = useMutation({
    mutationFn: async (guestData: { name: string; mobile_number: string }) => {
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          event_id: eventId,
          name: guestData.name,
          mobile_number: guestData.mobile_number,
        }])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate both guests and events queries
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setNewGuestName('');
      setNewGuestMobileNumber('');
      setIsAddDialogOpen(false);
      toast({
        title: "Guest added successfully!",
        description: "The guest has been added to your event."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding guest",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Edit guest mutation
  const editGuestMutation = useMutation({
    mutationFn: async (guest: { id: string; name: string; mobile_number: string }) => {
      const { error } = await supabase
        .from('guests')
        .update({
          name: guest.name,
          mobile_number: guest.mobile_number
        })
        .eq('id', guest.id);

      if (error) throw error;
      return guest;
    },
    onSuccess: () => {
      // Invalidate both guests and events queries
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEditGuestId(null);
      setEditGuestName('');
      setEditGuestMobileNumber('');
      setEditGuestCountryCode('+91');
      setIsEditDialogOpen(false);
      toast({
        title: "Guest updated",
        description: "Guest information has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating guest",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Delete guest mutation
  const deleteGuestMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both guests and events queries
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedGuests([]);
      toast({
        title: "Guest removed",
        description: "The guest has been removed from your event."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing guest",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (guestIds: string[]) => {
      const { error } = await supabase
        .from('guests')
        .delete()
        .in('id', guestIds);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate both guests and events queries
      queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedGuests([]);
      toast({
        title: "Guests removed",
        description: `${selectedGuests.length} guest${selectedGuests.length > 1 ? 's have' : ' has'} been removed from your event.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error removing guests",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleAddGuest = () => {
    if (!newGuestName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter guest name.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newGuestMobileNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter mobile number.",
        variant: "destructive"
      });
      return;
    }
    
    // Format mobile number with country code
    const formattedMobileNumber = `${newGuestCountryCode}-${newGuestMobileNumber.replace(/[\s\-\+]/g, '')}`;
    
    addGuestMutation.mutate({
      name: newGuestName,
      mobile_number: formattedMobileNumber
    });
  };

  const handleEditGuest = () => {
    if (!editGuestId) return;
    
    if (!editGuestName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter guest name.",
        variant: "destructive"
      });
      return;
    }
    
    if (!editGuestMobileNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter mobile number.",
        variant: "destructive"
      });
      return;
    }
    
    // Format mobile number with country code
    const formattedMobileNumber = `${editGuestCountryCode}-${editGuestMobileNumber.replace(/[\s\-\+]/g, '')}`;
    
    editGuestMutation.mutate({
      id: editGuestId,
      name: editGuestName,
      mobile_number: formattedMobileNumber
    });
  };

  const handleDeleteGuest = (guestId: string) => {
    if (confirm('Are you sure you want to remove this guest?')) {
      deleteGuestMutation.mutate(guestId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedGuests.length} guest${selectedGuests.length > 1 ? 's' : ''}?`)) {
      bulkDeleteMutation.mutate(selectedGuests);
    }
  };

  // Generate invitation URL for a guest using custom IDs if available
  const generateInvitationUrl = (guest: Guest) => {
    const baseUrl = window.location.origin;
    const customEventId = eventData?.custom_event_id;
    const customGuestId = guest.custom_guest_id;
    
    // Use custom IDs if available, otherwise fall back to UUIDs
    const eventIdToUse = customEventId || eventId;
    const guestIdToUse = customGuestId || guest.id;
    
    return `${baseUrl}/invite/${eventIdToUse}/${guestIdToUse}`;
  };

  const copyToClipboard = (guest: Guest) => {
    const invitationUrl = generateInvitationUrl(guest);
    navigator.clipboard.writeText(invitationUrl).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Invitation link has been copied to your clipboard."
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    });
  };

  const formatInvitationMessage = (guest: Guest, template: string) => {
    // Get event details for replacing tags
    const eventName = eventData?.name || '';
    const eventDetails = (eventData?.details as any) || {};
    const eventDate = eventDetails.wedding_date || eventDetails.date || '';
    
    // Replace tags with actual values
    let message = template
      .replace(/\{guest-name\}/g, guest.name)
      .replace(/\{unique-link\}/g, generateInvitationUrl(guest))
      .replace(/\{event-name\}/g, eventName)
      .replace(/\{event-date\}/g, eventDate);
      
    return message;
  };

  const shareInvitation = async (guest: Guest) => {
    // Get the custom invitation message template if it exists
    const eventDetails = (eventData?.details as any) || {};
    const messageTemplate = eventDetails.invitation_message_template || 
      `You're invited! Check out your invitation: {unique-link}`;
    
    // Format the message with guest details
    const formattedMessage = formatInvitationMessage(guest, messageTemplate);
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Event Invitation',
          text: formattedMessage,
        });
      } else {
        // If Web Share API is not available, open a share dialog or fallback to copy
        const shareWindow = window.open(
          `https://wa.me/?text=${encodeURIComponent(formattedMessage)}`,
          '_blank'
        );
        
        if (!shareWindow) {
          // If popup blocked, fallback to copying to clipboard
          copyToClipboard(guest);
        }
      }
    } catch (error) {
      // Fallback to copying to clipboard
      copyToClipboard(guest);
    }
  };

  const shareViaWhatsApp = (guest: Guest) => {
    // Get the custom invitation message template if it exists
    const eventDetails = (eventData?.details as any) || {};
    const messageTemplate = eventDetails.invitation_message_template || 
      `You're invited! Check out your invitation: {unique-link}`;
    
    // Format the message with guest details
    const formattedMessage = formatInvitationMessage(guest, messageTemplate);
    
    // Extract the phone number from the formatted mobile number
    const phoneNumber = guest.mobile_number.replace(/[^0-9+]/g, ''); // Clean the number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(formattedMessage)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const openEditDialog = (guest: Guest) => {
    setEditGuestId(guest.id);
    setEditGuestName(guest.name);
    
    // Parse the mobile number to separate country code and number
    const mobileNumberParts = guest.mobile_number.split('-');
    if (mobileNumberParts.length === 2) {
      setEditGuestCountryCode(mobileNumberParts[0]);
      setEditGuestMobileNumber(mobileNumberParts[1]);
    } else {
      // Fallback if the format is not as expected
      setEditGuestCountryCode('+91');
      setEditGuestMobileNumber(guest.mobile_number.replace(/^\+\d+-/, ''));
    }
    
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (guest: Guest) => {
    if (guest.accepted && guest.rsvp_data && Object.keys(guest.rsvp_data).length > 0) {
      return (
        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 rounded-md px-3 py-1 font-normal flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Submitted
        </Badge>
      );
    } else if (guest.accepted) {
      return (
        <Badge className="bg-green-50 text-green-700 hover:bg-green-50 rounded-md px-3 py-1 font-normal flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Accepted
        </Badge>
      );
    } else if (guest.viewed) {
      return (
        <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 rounded-md px-3 py-1 font-normal flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Viewed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-50 text-gray-600 hover:bg-gray-50 rounded-md px-3 py-1 font-normal flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
        </Badge>
      );
    }
  };

  const getResponseDate = (guest: Guest): string => {
    if ((guest as any).custom_fields_submitted_at) {
      return new Date((guest as any).custom_fields_submitted_at).toLocaleDateString();
    } else if (guest.accepted_at) {
      return new Date(guest.accepted_at).toLocaleDateString();
    } else if (guest.viewed_at) {
      return new Date(guest.viewed_at).toLocaleDateString();
    }
    return '-';
  };

  // Function to generate WhatsApp follow-up URL
  const getWhatsAppURL = (guest: Guest) => {
    // Get follow-up message from event details or use default
    const eventDetails = (eventData?.details as any) || {};
    const followupTemplate = eventDetails?.followup_message_template || 
      `Dear {guest-name},

You didn't submitted your rsvp till now.

Kindly Submit it as soon as possible by this Link : {unique-link}

Its help us in managing everything smoothly.

We look forward to celebrating with you!`;
    
    const invitationLink = `${window.location.origin}/invite/${eventId}/${guest.id}`;
    const message = followupTemplate
      .replace(/{guest-name}/g, guest.name)
      .replace(/{unique-link}/g, invitationLink);
    
    return `https://wa.me/${guest.mobile_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  // Function to handle CSV import
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          
          // Split into rows and remove empty ones
          const rows = text.split('\n')
            .map(row => row.trim())
            .filter(row => row.length > 0);

          if (rows.length === 0) {
            toast({
              title: "Empty file",
              description: "The file is empty",
              variant: "destructive"
            });
            return;
          }

          let success = 0;
          let failed = 0;

          // Process each row
          for (const row of rows) {
            const cols = row.split(',').map(c => c.trim());
            
            // Skip if not enough columns
            if (cols.length < 2) continue;

            // Get name and phone from first two columns
            const name = cols[0];
            let phone = cols[1].replace(/[^0-9+]/g, '');

            // Add +91 if it's a 10-digit number without country code
            if (phone.length === 10 && !phone.startsWith('+')) {
              phone = `+91-${phone}`;
            } else if (phone.startsWith('+') && !phone.includes('-')) {
              // If it has a + but no hyphen, add the hyphen after the country code
              const countryCodeEnd = phone.match(/^\+\d+/)?.[0].length || 3;
              phone = `${phone.substring(0, countryCodeEnd)}-${phone.substring(countryCodeEnd)}`;
            } else if (!phone.includes('-')) {
              // If no hyphen at all, assume +91 as default
              phone = `+91-${phone}`;
            }

            // Skip if name or phone is missing
            if (!name || !phone || phone.length < 10) continue;

            try {
              const { error } = await supabase
                .from('guests')
                .insert({
                  name,
                  mobile_number: phone,
                  event_id: eventId,
                  viewed: false,
                  accepted: false
                });

              if (error) {
                failed++;
              } else {
                success++;
              }
            } catch (err) {
              failed++;
            }
          }

          if (success > 0) {
            toast({
              title: "Import successful",
              description: `Added ${success} guests${failed > 0 ? ` (${failed} failed)` : ''}`
            });
            // Refresh the guest list
            queryClient.invalidateQueries({ queryKey: ['guests', eventId] });
          } else {
            toast({
              title: "Import failed",
              description: "Could not import any guests. Make sure your CSV has two columns: first for names and second for phone numbers.",
              variant: "destructive"
            });
          }
        } catch (err) {
          toast({
            title: "Processing error",
            description: "Failed to process CSV file. Make sure it's a valid CSV file.",
            variant: "destructive"
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "Read error",
          description: "Failed to read the file",
          variant: "destructive"
        });
      };

      reader.readAsText(file);
    } catch (err) {
      toast({
        title: "Import error",
        description: "Failed to import file",
        variant: "destructive"
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenExportDialog = () => {
    if (!guests?.length) {
      toast({
        title: "No guests to export",
        description: "Add some guests first before exporting.",
        variant: "destructive"
      });
      return;
    }
    setIsExportDialogOpen(true);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
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

  const renderMobileView = () => (
    <div className="space-y-4">
      {/* Guest List */}
      {currentGuests?.map((guest) => (
        <div key={guest.id} className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{guest.name}</h3>
              <p className="text-sm text-gray-500">{guest.mobile_number}</p>
              <div className="mt-1">{getStatusBadge(guest)}</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <InstantTooltip content="Copy Invitation Link">
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(guest)}>
                <Copy className="h-4 w-4" />
              </Button>
            </InstantTooltip>
            <InstantTooltip content="Share Invitation">
              <Button variant="ghost" size="sm" onClick={() => shareInvitation(guest)}>
                <Share2 className="h-4 w-4" />
              </Button>
            </InstantTooltip>
            <InstantTooltip content="Share via WhatsApp">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => shareViaWhatsApp(guest)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </Button>
            </InstantTooltip>
            <InstantTooltip content="Edit Guest Details">
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(guest)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </InstantTooltip>
            <InstantTooltip content="Remove Guest">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-red-50"
                onClick={() => handleDeleteGuest(guest.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
              </Button>
            </InstantTooltip>
          </div>
        </div>
      ))}
      {renderPagination()}
    </div>
  );

  const renderDesktopView = () => (
    <div className="overflow-x-auto -mx-6 sm:mx-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#F3F4F6] [&::-webkit-scrollbar-thumb]:bg-[#F3F4F6] hover:[&::-webkit-scrollbar-thumb]:bg-[#E5E7EB]">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
          <div className="min-w-[800px] sm:min-w-0 overflow-y-auto max-h-[600px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-[#F3F4F6] [&::-webkit-scrollbar-thumb]:bg-[#F3F4F6] hover:[&::-webkit-scrollbar-thumb]:bg-[#E5E7EB]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedGuests.length === currentGuests?.length && currentGuests?.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedGuests((prev) => [
                            ...new Set([...prev, ...(currentGuests?.map(g => g.id) || [])])
                          ]);
                        } else {
                          setSelectedGuests(prev => 
                            prev.filter(id => !currentGuests?.find(g => g.id === id))
                          );
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Mobile Number</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
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
                    <TableCell className="whitespace-nowrap">{guest.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{guest.mobile_number}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(guest)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <InstantTooltip content="Copy Invitation Link">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(guest)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </InstantTooltip>
                        <InstantTooltip content="Share Invitation">
                          <Button variant="ghost" size="sm" onClick={() => shareInvitation(guest)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </InstantTooltip>
                        <InstantTooltip content="Share via WhatsApp">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => shareViaWhatsApp(guest)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </Button>
                        </InstantTooltip>
                        <InstantTooltip content="Edit Guest Details">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(guest)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </InstantTooltip>
                        <InstantTooltip content="Remove Guest">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-50"
                            onClick={() => handleDeleteGuest(guest.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                          </Button>
                        </InstantTooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );

  // Check if RSVP type is detailed to show RSVP Status tab
  const isDetailedRSVP = (eventData?.rsvp_config as any)?.type === 'detailed';

  // Render RSVP Status table for detailed RSVP type
  const renderRSVPStatusTable = () => {
    if (!filteredGuests?.length) {
      return (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No RSVP data yet</h3>
          <p className="text-gray-500 mb-4">RSVP responses will appear here once guests respond</p>
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-4">
          {currentGuests?.map((guest) => (
            <div key={guest.id} className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{guest.name}</h3>
                  <p className="text-sm text-gray-500">{guest.mobile_number}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {getStatusBadge(guest)}
                    {guest.accepted && guest.accepted_at && (
                      <span className="text-xs text-green-600">
                        Responded {new Date(guest.accepted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* RSVP Data Display */}
              {guest.rsvp_data && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">RSVP Details:</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(guest.rsvp_data as Record<string, any>).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-gray-900 font-medium">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Create dynamic headers including custom fields
    const baseHeaders = ['Guest Name', 'Mobile', 'Status', 'Response Date'];
    const customFieldHeaders = rsvpFields.map(field => field.field_label);
    const allHeaders = [...baseHeaders, ...customFieldHeaders, 'Actions'];

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {allHeaders.map((header, index) => (
                <TableHead key={index} className={index === allHeaders.length - 1 ? 'text-right' : ''}>
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentGuests?.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>{guest.mobile_number}</TableCell>
                <TableCell>{getStatusBadge(guest)}</TableCell>
                <TableCell>{getResponseDate(guest)}</TableCell>
                
                {/* Dynamic custom field columns */}
                {rsvpFields.map((field) => (
                  <TableCell key={field.id}>
                    {guest.rsvp_data && (guest.rsvp_data as any)[field.field_name] !== undefined ? (
                      <span className="text-sm">
                        {typeof (guest.rsvp_data as any)[field.field_name] === 'boolean' 
                          ? ((guest.rsvp_data as any)[field.field_name] ? 'Yes' : 'No')
                          : String((guest.rsvp_data as any)[field.field_name])
                        }
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                ))}
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {guest.rsvp_data && (
                      <InstantTooltip content="View Full RSVP Details">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-80 max-h-60 overflow-y-auto">
                            <div className="p-3 space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 border-b pb-2">Complete RSVP Response</h4>
                              {Object.entries(guest.rsvp_data as Record<string, any>).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600 capitalize flex-1 mr-2">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-gray-900 font-medium text-right">
                                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </InstantTooltip>
                    )}
                    <InstantTooltip content="Follow up via WhatsApp">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(getWhatsAppURL(guest), '_blank')}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                    </InstantTooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderGuestListControls = () => (
    <div className="flex flex-wrap gap-2 items-center justify-between">
      <div className="flex-1 min-w-[200px] max-w-xl flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={isMobile ? "icon" : "default"}>
              <Filter className="h-4 w-4" />
              {!isMobile && <span className="ml-2">Filter</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedFilter("all")}>
              All Guests
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter("viewed")}>
              Viewed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter("accepted")}>
              Accepted
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter("submitted")}>
              Submitted
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter("pending")}>
              Pending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <input
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          ref={fileInputRef}
          className="hidden"
          id="csv-upload"
        />
        
        <div className="flex w-full justify-between gap-2">
          {/* Import button - show on both mobile and desktop */}
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import Guests</span>
          </Button>

          <Button
            size="default"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Guest</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const renderGuestListContent = () => (
    <>
      {/* Guest list section */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : !filteredGuests?.length ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No guests yet</h3>
          <p className="text-gray-500 mb-4">Start adding guests to your event</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk actions - only show on desktop */}
          {!isMobile && selectedGuests.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">
                {selectedGuests.length} guest{selectedGuests.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Responsive guest list */}
          {isMobile ? renderMobileView() : renderDesktopView()}
        </div>
      )}
    </>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guest Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Guest Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isDetailedRSVP ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="guests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Guest List
              </TabsTrigger>
              <TabsTrigger value="rsvp-status" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                RSVP Status
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="guests" className="space-y-4">
              {renderGuestListControls()}
              {renderGuestListContent()}
            </TabsContent>
            
            <TabsContent value="rsvp-status" className="space-y-4">
              {/* RSVP Status Tab Content */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex-1 min-w-[200px] max-w-xl flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size={isMobile ? "icon" : "default"}>
                        <Filter className="h-4 w-4" />
                        {!isMobile && <span className="ml-2">Filter</span>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedFilter("all")}>
                        All Responses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter("accepted")}>
                        Accepted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter("pending")}>
                        Pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleOpenExportDialog}
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export RSVP Data</span>
                  </Button>
                </div>
              </div>

              {/* RSVP Status Content */}
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : (
                <div className="space-y-4">
                  {renderRSVPStatusTable()}
                  {renderPagination()}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {renderGuestListControls()}
            {renderGuestListContent()}
          </div>
        )}

        {/* Import CSV Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Import Guests from CSV</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">CSV File Requirements:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Your CSV file should have the following columns:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><span className="font-medium">Guest Name</span> (required)</li>
                    <li><span className="font-medium">Mobile Number</span> (required)</li>
                  </ul>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Example CSV Format:</p>
                  <code className="text-xs block bg-secondary p-2 rounded">
                    Guest Name,Mobile Number<br/>
                    John Doe,1234567890<br/>
                    Jane Smith,9876543210
                  </code>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                  <p className="flex items-start">
                    <span className="mr-2">ℹ️</span>
                    Make sure your CSV file follows this format to ensure successful import.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => document.getElementById('csv-upload')?.click()}
                className="bg-gradient-to-r from-premium-gold to-sunset-orange text-white hover:opacity-90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Guest Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Guest Name</Label>
                <Input
                  id="name"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Enter guest name"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect 
                    value={newGuestCountryCode} 
                    onValueChange={setNewGuestCountryCode} 
                  />
                  <Input
                    id="mobile"
                    value={newGuestMobileNumber}
                    onChange={(e) => setNewGuestMobileNumber(e.target.value)}
                    placeholder="Enter mobile number"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter mobile number without country code
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGuest}>
                Add Guest
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Guest Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Guest Name</Label>
                <Input
                  id="edit-name"
                  value={editGuestName}
                  onChange={(e) => setEditGuestName(e.target.value)}
                  placeholder="Enter guest name"
                />
              </div>
              <div>
                <Label htmlFor="edit-mobile">Mobile Number</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect 
                    value={editGuestCountryCode} 
                    onValueChange={setEditGuestCountryCode} 
                  />
                  <Input
                    id="edit-mobile"
                    value={editGuestMobileNumber}
                    onChange={(e) => setEditGuestMobileNumber(e.target.value)}
                    placeholder="Enter mobile number"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter mobile number without country code
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditGuest}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export RSVP Dialog */}
        <ExportRSVPDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          guests={guests || []}
          customFields={rsvpFields}
          eventName={eventData?.name || 'Event'}
        />
      </CardContent>
    </Card>
  );
};
