import { useState, useEffect } from 'react';
import { useUpdateEvent } from '@/hooks/useEvents';
import { Event } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, UserCheck, MessageSquare, MessageCircle, Users } from 'lucide-react';
import { RSVPSettingsContent } from './RSVPSettingsContent';
import { InvitationMessageContent } from './InvitationMessageContent';
import { FollowUpMessageContent } from './FollowUpMessageContent';
import { EventWiseGuestManagement } from './EventWiseGuestManagement';

interface MainEventSettingsDialogProps {
  event: Event;
  children: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialActiveSetting?: 'rsvp' | 'message' | 'followup' | 'guest-events';
}

type SettingTab = {
  id: 'rsvp' | 'message' | 'followup' | 'guest-events';
  title: string;
  icon: any;
  description: string;
};

export const MainEventSettingsDialog = ({ 
  event, 
  children, 
  isOpen: externalIsOpen, 
  onOpenChange: externalOnOpenChange,
  initialActiveSetting = 'rsvp'
}: MainEventSettingsDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rsvp' | 'message' | 'followup' | 'guest-events' | null>(null);
  const updateEventMutation = useUpdateEvent();
  
  // Determine if we're using controlled or uncontrolled state
  const isControlled = externalIsOpen !== undefined && externalOnOpenChange !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;
  const onOpenChange = isControlled 
    ? externalOnOpenChange 
    : setInternalIsOpen;

  // Update active tab when initialActiveSetting changes or dialog opens
  useEffect(() => {
    if (isOpen && initialActiveSetting) {
      setActiveTab(initialActiveSetting);
    } else if (!isOpen) {
      // Reset tab when dialog closes to prevent state issues
      setActiveTab(null);
    }
  }, [initialActiveSetting, isOpen]);

  const isDetailedRSVP = event.rsvp_config && 
    typeof event.rsvp_config === 'object' && 
    'type' in event.rsvp_config && 
    event.rsvp_config.type === 'detailed';

  const availableTabs: SettingTab[] = [
    {
      id: 'rsvp',
      title: 'RSVP Settings',
      icon: UserCheck,
      description: 'Configure RSVP options and responses'
    },
    {
      id: 'message',
      title: 'Invitation Message',
      icon: MessageSquare,
      description: 'Customize invitation message text'
    },
    ...(isDetailedRSVP ? [{
      id: 'followup' as const,
      title: 'Follow-up Message',
      icon: MessageCircle,
      description: 'Set up follow-up messages for guests'
    }] : []),
    {
      id: 'guest-events',
      title: 'Guest Event Access',
      icon: Users,
      description: 'Manage guest access to specific events'
    }
  ];

  const handleSave = async (data: any) => {
    console.log('[MainEventSettingsDialog] handleSave called with data:', data);
    console.log('[MainEventSettingsDialog] Current event ID:', event.id);
    console.log('[MainEventSettingsDialog] Current event rsvp_config before update:', event.rsvp_config);
    
    return new Promise<void>((resolve, reject) => {
      updateEventMutation.mutate(
        { eventId: event.id, data },
        {
          onSuccess: (updatedEvent) => {
            console.log('[MainEventSettingsDialog] Update successful, updated event:', updatedEvent);
            toast({ 
              title: 'Settings updated successfully!',
              description: activeTab === 'rsvp' 
                ? 'RSVP settings have been updated.' 
                : activeTab === 'message'
                ? 'Invitation message has been updated.'
                : activeTab === 'followup'
                ? 'Follow-up message has been updated.'
                : 'Settings have been updated.'
            });
            // Keep dialog open and just show success
            resolve();
          },
          onError: (error) => {
            console.error('[MainEventSettingsDialog] Update failed:', error);
            toast({ 
              title: 'Failed to update settings', 
              description: error.message || 'An error occurred while saving your changes.',
              variant: 'destructive' 
            });
            reject(error);
          }
        }
      );
    });
  };

  const handleClose = () => {
    setActiveTab(null);
    onOpenChange(false);
  };

  const handleBackToMenu = () => {
    setActiveTab(null);
  };

  const renderContent = () => {
    if (!activeTab) {
      // Main menu view
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold">Event Settings</h3>
            <p className="text-sm text-gray-500">Choose a setting to configure</p>
          </div>
          
          <div className="grid gap-3">
            {availableTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant="outline"
                  className="w-full p-4 h-auto justify-start hover:bg-gray-50 transition-colors"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-sm">{tab.title}</div>
                      <div className="text-xs text-gray-500 truncate">{tab.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    // Individual tab content view
    const currentTab = availableTabs.find(tab => tab.id === activeTab);
    const IconComponent = currentTab?.icon;

    return (
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToMenu}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 flex-1">
            {IconComponent && (
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center">
                <IconComponent className="w-3 h-3 text-gray-600" />
              </div>
            )}
            <h3 className="font-semibold text-sm">{currentTab?.title}</h3>
          </div>
        </div>

        {/* Tab content */}
        <div className="min-h-[400px]">
          {activeTab === 'rsvp' && (
            <RSVPSettingsContent 
              event={event}
              onSave={handleSave}
              isSaving={updateEventMutation.isPending}
              onCancel={handleBackToMenu}
            />
          )}
          
          {activeTab === 'message' && (
            <InvitationMessageContent 
              event={event}
              onSave={handleSave}
              isSaving={updateEventMutation.isPending}
              onCancel={handleBackToMenu}
            />
          )}
          
          {activeTab === 'followup' && (
            <FollowUpMessageContent 
              event={event}
              onSave={handleSave}
              isSaving={updateEventMutation.isPending}
              onCancel={handleBackToMenu}
            />
          )}
          
          {activeTab === 'guest-events' && (
            <EventWiseGuestManagement 
              eventId={event.id}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="sr-only">Event Settings</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
