import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EnhancedInvitationLoader } from '@/components/ui/enhanced-invitation-loader';
import { constructInvitationUrl, getTemplateBaseUrl, getAllowedOrigins } from '@/utils/iframeMessaging';
import { SimpleRSVPService } from '@/services/simpleRSVPService';

interface EventData {
  id: string;
  name: string;
  details: any;
  template?: any;
  templates?: any;
  custom_event_id?: string;
  rsvp_config?: any;
  customFields?: any[];
  allow_rsvp_edit?: boolean;
  wishes_enabled?: boolean;
}

interface GuestData {
  id: string;
  name: string;
  mobile_number: string;
  viewed: boolean;
  accepted: boolean;
  viewed_at?: string | null;
  accepted_at?: string | null;
  custom_guest_id?: string;
  rsvp_data?: any;
}

const GuestInvitationPage = () => {
  const { eventId, guestId } = useParams();

  // 📋 LOG: URL Parameters
  console.log('🔗 ===== INVITATION URL ANALYSIS =====');
  console.log('📍 Current URL:', window.location.href);
  console.log('🎯 Extracted eventId:', eventId);
  console.log('👤 Extracted guestId:', guestId);
  console.log('🌐 Origin:', window.location.origin);
  console.log('🛤️ Pathname:', window.location.pathname);
  console.log('========================================');
  const [event, setEvent] = useState<EventData | null>(null);
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [guestEventAccess, setGuestEventAccess] = useState<any[]>([]);
  const [templateTheme, setTemplateTheme] = useState<any>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [lastToastMessage, setLastToastMessage] = useState<string | null>(null);
  const [toastTimestamp, setToastTimestamp] = useState<number>(0);

  // Helper function to show toast with duplicate prevention
  const showToast = (message: { title: string; description: string; variant?: "default" | "destructive" }) => {
    const now = Date.now();
    const messageKey = `${message.title}-${message.description}`;
    
    // Prevent duplicate toasts within 3 seconds
    if (lastToastMessage === messageKey && (now - toastTimestamp) < 3000) {
      console.log('🚫 Duplicate toast prevented:', messageKey);
      return;
    }
    
    setLastToastMessage(messageKey);
    setToastTimestamp(now);
    toast(message);
    console.log('✅ Toast shown:', messageKey);
  };

  // Helper function to determine event category
  const getEventCategory = (event: EventData): string => {
    if (!event?.templates?.component_name) return 'wedding';
    
    const componentName = event.templates.component_name.toLowerCase();
    if (componentName.includes('royal')) return 'royal';
    if (componentName.includes('birthday')) return 'birthday';
    if (componentName.includes('corporate')) return 'corporate';
    return 'wedding';
  };

  // Simple status calculation for templates
  const getTemplateStatus = (guestData: GuestData): null | "accepted" | "submitted" => {
    if (guestData.accepted && guestData.rsvp_data) {
      return "submitted";
    } else if (guestData.accepted) {
      return "accepted";
    }
    return null;
  };

  // Simplified update using SimpleRSVPService
  const updateGuestStatus = async (updates: {
    viewed?: boolean;
    viewed_at?: string;
    accepted?: boolean;
    accepted_at?: string;
    rsvp_data?: any;
  }) => {
    if (!guest) return;

    try {
      await SimpleRSVPService.updateGuestStatus(guest.id, updates);
      
      // Update local state
      setGuest(prev => prev ? { 
        ...prev, 
        ...updates
      } : prev);
      
      console.log('Guest status updated successfully');
    } catch (error) {
      console.error('Error updating guest status:', error);
      showToast({
        title: "Error",
        description: "Failed to update invitation status",
        variant: "destructive",
      });
    }
  };

  // Mark as viewed helper
  const markAsViewed = async () => {
    if (!guest || guest.viewed) return;

    await updateGuestStatus({
      viewed: true, 
      viewed_at: new Date().toISOString()
    });
  };

  const handlePostMessage = async (messageEvent: MessageEvent) => {
    console.log('📥 Received postMessage from template:', messageEvent.data);
    console.log('📍 Message origin:', messageEvent.origin);
    
    // 🔍 Comprehensive filter for non-template messages (browser extensions, ad-blockers, etc.)
    const messageData = messageEvent.data;
    
    // Filter out known browser extension messages
    if (messageData?.posdMessageId === 'PANELOS_MESSAGE' || 
        messageData?.type === 'VIDEO_XHR_CANDIDATE' ||
        messageData?.from === 'detector' ||
        messageData?.to === 'detect' ||
        messageData?.posdHash ||
        messageData?.source === 'react-devtools-bridge' ||
        messageData?.source === 'react-devtools-content-script' ||
        messageData?.source === 'react-devtools-inject-script' ||
        messageData?.type === 'webpackOk' ||
        messageData?.type === 'webpackProgress' ||
        messageData?.type === 'webpackWarnings' ||
        messageData?.type === 'webpackErrors' ||
        messageData?.source === 'vite-plugin-react' ||
        (typeof messageData === 'string' && messageData.includes('webpack')) ||
        (typeof messageData === 'string' && messageData.includes('react-devtools')) ||
        messageData?.payload?.type === 'overlayCleared') {
      console.log('🚫 Filtered out browser extension/dev tool message:', messageData?.type || messageData?.source || 'unknown');
      return;
    }
    
    // Validate message structure - must have type property for template messages
    if (!messageData || typeof messageData !== 'object' || !messageData.type) {
      console.log('🚫 Filtered out invalid message structure:', messageData);
      return;
    }
    
    // Only allow known template message types
    const validTemplateMessageTypes = [
      'template_ready',
      'TEMPLATE_READY', 
      'RSVP_ACCEPTED',
      'RSVP_SUBMITTED',
      'RSVP_UPDATED',
      'GUEST_ACCEPTANCE',
      'GUEST_RSVP_UPDATE',
      'STATUS_UPDATE',
      'INVITATION_VIEWED'
    ];
    
    if (!validTemplateMessageTypes.includes(messageData.type)) {
      console.log('🚫 Filtered out unknown message type:', messageData.type);
      return;
    }
    
    const allowedOrigins = getAllowedOrigins(event?.templates);
    console.log('✅ Allowed origins:', allowedOrigins);
    
    if (!allowedOrigins.includes(messageEvent.origin)) {
      console.warn('❌ Message from unauthorized origin:', messageEvent.origin);
      return;
    }

    // Use SimpleRSVPService to handle all postMessage events
    try {
      console.log('🔄 Processing message with SimpleRSVPService...');
      
      const eventId = event?.custom_event_id || event?.id;
      const guestId = guest?.custom_guest_id || guest?.id;
      
      console.log('📋 PostMessage Data Check:');
      console.log('event object:', event);
      console.log('guest object:', guest);
      console.log('eventId for postMessage:', eventId);
      console.log('guestId for postMessage:', guestId);
      console.log('messageEvent.data:', messageEvent.data);
      
      if (!eventId || !guestId) {
        console.error('🚨 Missing eventId or guestId for postMessage processing!');
        console.error('eventId:', eventId);
        console.error('guestId:', guestId);
        console.error('event object exists:', !!event);
        console.error('guest object exists:', !!guest);
        
        // For template_ready message, don't throw error but warn
        if (messageEvent.data.type === 'template_ready' || messageEvent.data.type === 'TEMPLATE_READY') {
          console.warn('⚠️ Template ready but missing IDs - will try to send data anyway');
        } else {
          throw new Error(`Missing eventId or guestId - eventId: ${eventId}, guestId: ${guestId}`);
        }
      }
      
      const result = await SimpleRSVPService.handlePostMessage({
        type: messageEvent.data.type,
        data: {
          eventId: eventId,
          guestId: guestId,
          ...messageEvent.data.data,
          ...messageEvent.data.payload
        }
      });
      console.log('✅ SimpleRSVPService response:', result);

      // Special handling for TEMPLATE_READY message - send initial data immediately
      if (messageEvent.data.type === 'template_ready' || messageEvent.data.type === 'TEMPLATE_READY') {
        console.log('🎯 Template is ready! Sending initial invitation data...');
        
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        
        console.log('🔍 Template Ready Check:');
        console.log('iframe exists:', !!iframe);
        console.log('iframe.contentWindow exists:', !!iframe?.contentWindow);
        console.log('event exists:', !!event);
        console.log('guest exists:', !!guest);
        
        if (!iframe || !iframe.contentWindow) {
          console.error('❌ Iframe not ready for template_ready response');
          return;
        }
        
        if (!event || !guest) {
          console.error('❌ Missing event or guest data for template_ready response');
          console.error('event:', event);
          console.error('guest:', guest);
          return;
        }
        
        const targetOrigin = getTemplateBaseUrl(event.templates);
        console.log('📤 Sending to origin:', targetOrigin);
        
        // Send complete invitation data
        const invitationPayload = {
          type: 'INVITATION_LOADED',
          data: {
            eventId: event.custom_event_id || event.id,
            guestId: guest.custom_guest_id || guest.id,
            eventDetails: event.details,
            guestName: guest.name,
            status: guest.accepted && guest.rsvp_data ? 'submitted' : guest.accepted ? 'accepted' : guest.viewed ? 'viewed' : 'pending',
            showAcceptButton: !guest.accepted,
            showSubmitButton: guest.accepted && !guest.rsvp_data,
            rsvpFields: event.customFields || [],
            existingRsvpData: guest.rsvp_data,
            wishesEnabled: Boolean((event as any).wishes_enabled)
          }
        };
        
        iframe.contentWindow.postMessage(invitationPayload, targetOrigin);
        console.log('📤 Sent invitation data in response to TEMPLATE_READY:', invitationPayload);
      }

      // If result returned, send updated payload to template
      if (result) {
        console.log('📤 Sending updated payload back to template:', result);
        
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow && event) {
          const targetOrigin = getTemplateBaseUrl(event.templates);
          iframe.contentWindow.postMessage({
            type: 'INVITATION_PAYLOAD_UPDATE',
            data: result
          }, targetOrigin);
          
          console.log('✅ Sent INVITATION_PAYLOAD_UPDATE to template');
        }
        
        // Force refresh guest data from database to reflect changes
        if (guest) {
          console.log('🔄 Refreshing guest data from database...');
          
          const { data: updatedGuest, error: guestError } = await supabase
            .from('guests')
            .select('*')
            .eq('id', guest.id)
            .single();
            
          if (guestError) {
            console.error('❌ Error refreshing guest data:', guestError);
          } else if (updatedGuest) {
            console.log('✅ Updated guest data:', updatedGuest);
            console.log('- Old Status:', {
              viewed: guest.viewed,
              accepted: guest.accepted,
              rsvp_data: !!guest.rsvp_data
            });
            console.log('- New Status:', {
              viewed: updatedGuest.viewed,
              accepted: updatedGuest.accepted,
              rsvp_data: !!updatedGuest.rsvp_data
            });
            
            setGuest(updatedGuest);
            
            // Also send updated status to template for immediate UI update
            const updatedStatus = updatedGuest.accepted && updatedGuest.rsvp_data ? 'submitted' : 
                                updatedGuest.accepted ? 'accepted' : 
                                updatedGuest.viewed ? 'viewed' : 'pending';
            
            if (iframe && iframe.contentWindow && event) {
              const statusTargetOrigin = getTemplateBaseUrl(event.templates);
              const statusUpdate = {
                type: 'STATUS_UPDATE',
                data: {
                  status: updatedStatus,
                  showAcceptButton: !updatedGuest.accepted,
                  showSubmitButton: updatedGuest.accepted && !updatedGuest.rsvp_data,
                  guestAccepted: updatedGuest.accepted,
                  hasRsvpData: !!updatedGuest.rsvp_data
                }
              };
              
              iframe.contentWindow.postMessage(statusUpdate, statusTargetOrigin);
              console.log('📤 Sent STATUS_UPDATE to template:', statusUpdate);
            }
          }
        }
        
        // Show appropriate toast based on message type
        const messageType = messageEvent.data.type;
        // if (messageType === 'RSVP_ACCEPTED' || messageType === 'GUEST_ACCEPTANCE') {
        //   showToast({
        //     title: "Invitation Accepted!",
        //     description: `Thank you ${guest?.name} for accepting the invitation.`,
        //     variant: "default",
        //   });
        // } else if (messageType === 'RSVP_SUBMITTED' || messageType === 'RSVP_UPDATED' || messageType === 'GUEST_RSVP_UPDATE') {
        //   showToast({
        //     title: "RSVP Details Submitted!",
        //     description: `Thank you ${guest?.name} for providing your RSVP details.`,
        //     variant: "default",
        //   });
        // }
        
        console.log('🎉 RSVP processing completed successfully for message type:', messageType);
      }
    } catch (error) {
      console.error('❌ POSTMESSAGE ERROR:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Original message data:', messageEvent.data);
      console.error('❌ Message origin:', messageEvent.origin);
      
      // Only show error toast for actual template-related errors, not for missing IDs during startup
      // const isStartupError = error.message?.includes('Missing eventId or guestId') && 
      //                       (messageEvent.data.type === 'template_ready' || messageEvent.data.type === 'TEMPLATE_READY');
      
      // // const isNetworkError = error.message?.includes('Network') || error.message?.includes('fetch');
      
      // if (!isStartupError && messageEvent.data.type !== 'template_ready' && messageEvent.data.type !== 'TEMPLATE_READY') {
      //   // Only show error for actual user actions, not for template initialization
      //   if (messageEvent.data.type === 'INVITATION_VIEWED' || messageEvent.data.type === 'RSVP_ACCEPTED') {
      //     showToast({
      //       title: "Error", 
      //       description: isNetworkError ? "Network connection issue. Please try again." : "Failed to process your response",
      //       variant: "destructive",
      //     });
      //     console.log("🚨 User action error - showing toast");
      //   } else {
      //     console.warn('⚠️ Non-critical error - not showing user toast:', messageEvent.data.type);
      //   }
      // } else {
      //   console.warn('⚠️ Non-critical error during startup or template initialization - not showing user toast');
      // }
    }
  };


  useEffect(() => {
    window.addEventListener('message', handlePostMessage);
    return () => window.removeEventListener('message', handlePostMessage);
  }, [guest, event]);

  useEffect(() => {
    const fetchInvitationData = async () => {
      console.log('GuestInvitationPage mounted with eventId:', eventId, 'guestId:', guestId);
      
      if (!eventId || !guestId) {
        console.error('Missing parameters - eventId:', eventId, 'guestId:', guestId);
        setError('Invalid invitation link - missing parameters');
        return;
      }

      try {
        setError(null);

        console.log('Starting data fetch for eventId:', eventId, 'guestId:', guestId);

        // Try to fetch event by custom ID first, then fallback to UUID
        let eventQuery = supabase
          .from('events')
          .select(`
            *,
            templates (*)
          `);

        // Check if eventId looks like a custom ID (5 chars) or UUID
        if (eventId.length <= 10 && /^[A-Z0-9]+$/i.test(eventId)) {
          eventQuery = eventQuery.eq('custom_event_id', eventId);
        } else {
          eventQuery = eventQuery.eq('id', eventId);
        }

        const { data: eventData, error: eventError } = await eventQuery.single();

        if (eventError) {
          console.error('Event fetch error:', eventError);
          if (eventError.code === 'PGRST116') {
            throw new Error('Event not found');
          }
          throw eventError;
        }

        console.log('🎊 ===== EVENT DATA FETCHED =====');
        console.log('📊 Complete Event Object:', eventData);
        console.log('📋 Event Basic Info:');
        console.log('   - ID:', eventData.id);
        console.log('   - Custom Event ID:', eventData.custom_event_id);
        console.log('   - Name:', eventData.name);
        console.log('   - Created At:', eventData.created_at);
        console.log('   - Host ID:', eventData.host_id);
        console.log('💒 Event Details Object:', eventData.details);
        console.log('💒 Event Details Type:', typeof eventData.details);
        console.log('💒 Event Details (Formatted):');
        console.log(JSON.stringify(eventData.details, null, 2));
        console.log('🎨 Template Info:');
        console.log('   - Templates Object:', eventData.templates);
        console.log('   - Template Type:', eventData.templates?.template_type);
        console.log('   - External URL:', eventData.templates?.external_url);
        console.log('   - Component Name:', eventData.templates?.component_name);
        console.log('⚙️ RSVP Config:', eventData.rsvp_config);
        console.log('📝 Custom Fields:', (eventData as any).customFields);
        console.log('==================================');
        
        // Check if event details are empty or null
        if (!eventData.details || Object.keys(eventData.details).length === 0) {
          console.warn('⚠️ WARNING: Event details are empty! Adding fallback data...');
          eventData.details = {
            bride_name: 'Bride',
            groom_name: 'Groom', 
            wedding_date: '2024-12-31',
            wedding_time: '18:00',
            venue_name: 'Wedding Venue',
            venue_address: 'Venue Address'
          };
          console.log('✅ Added fallback event details:', eventData.details);
        }

        // Fetch guest data - check custom ID or UUID
        let guestQuery = supabase
          .from('guests')
          .select('*');

        if (guestId.length <= 5 && /^[A-Z0-9]+$/i.test(guestId)) {
          guestQuery = guestQuery.eq('custom_guest_id', guestId);
        } else {
          guestQuery = guestQuery.eq('id', guestId);
        }
        
        // Ensure guest belongs to this event
        guestQuery = guestQuery.eq('event_id', eventData.id);

        const { data: guestData, error: guestError } = await guestQuery.single();

        if (guestError) {
          console.error('Guest fetch error:', guestError);
          if (guestError.code === 'PGRST116') {
            throw new Error('Guest not found');
          }
          throw guestError;
        }

        console.log('👤 ===== GUEST DATA FETCHED =====');
        console.log('📊 Complete Guest Object:', guestData);
        console.log('📋 Guest Basic Info:');
        console.log('   - ID:', guestData.id);
        console.log('   - Custom Guest ID:', guestData.custom_guest_id);
        console.log('   - Name:', guestData.name);
        console.log('   - Mobile Number:', guestData.mobile_number);
        console.log('   - Email:', (guestData as any).email || 'Not provided');
        console.log('   - Event ID (linked):', guestData.event_id);
        console.log('✅ Guest Status:');
        console.log('   - Viewed:', guestData.viewed);
        console.log('   - Viewed At:', guestData.viewed_at);
        console.log('   - Accepted:', guestData.accepted);
        console.log('   - Accepted At:', guestData.accepted_at);
        console.log('📝 RSVP Data:');
        console.log('   - Has RSVP Data:', !!guestData.rsvp_data);
        console.log('   - RSVP Data Object:', guestData.rsvp_data);
        console.log('🔗 Additional Info:');
        console.log('   - Created At:', guestData.created_at);
        console.log('   - Updated At:', (guestData as any).updated_at || 'Not tracked');
        console.log('=================================');

        // Fetch guest event access permissions
        const { data: accessData, error: accessError } = await supabase
          .from('guest_event_access')
          .select('*')
          .eq('guest_id', guestData.id)
          .eq('event_id', eventData.id);

        if (accessError) {
          console.warn('Could not fetch guest event access:', accessError);
        } else {
          console.log('🔑 ===== GUEST ACCESS PERMISSIONS =====');
          console.log('📊 Access Data:', accessData);
          console.log('📝 Number of Access Records:', accessData?.length || 0);
          if (accessData && accessData.length > 0) {
            accessData.forEach((access, index) => {
              console.log(`   Access ${index + 1}:`, access);
            });
          }
          console.log('=====================================');
          setGuestEventAccess(accessData || []);
        }

        // Fetch custom RSVP fields if any
        const { data: customFields, error: fieldsError } = await supabase
          .rpc('get_event_custom_rsvp_fields', { event_uuid: eventData.id });

        if (fieldsError) {
          console.warn('Could not fetch custom RSVP fields:', fieldsError);
        } else {
          console.log('📝 ===== CUSTOM RSVP FIELDS =====');
          console.log('📊 Custom Fields Data:', customFields);
          console.log('📝 Number of Custom Fields:', customFields?.length || 0);
          if (customFields && customFields.length > 0) {
            customFields.forEach((field, index) => {
              console.log(`   Field ${index + 1}:`);
              console.log('     - ID:', field.id);
              console.log('     - Name:', field.field_name);
              console.log('     - Label:', field.field_label);
              console.log('     - Type:', field.field_type);
              console.log('     - Required:', field.is_required);
              console.log('     - Placeholder:', field.placeholder_text);
              console.log('     - Display Order:', field.display_order);
            });
          }
          console.log('===============================');
          (eventData as any).customFields = customFields || [];
        }

        setEvent(eventData);
        setGuest(guestData);

        console.log('📊 ===== DATA SUMMARY & ANALYSIS =====');
        console.log('🔗 URL Mapping Analysis:');
        console.log('   - URL eventId → Database custom_event_id:', `${eventId} → ${eventData.custom_event_id}`);
        console.log('   - URL guestId → Database custom_guest_id:', `${guestId} → ${guestData.custom_guest_id}`);
        console.log('   - Guest belongs to event:', guestData.event_id === eventData.id);
        console.log('💒 Event Analysis:');
        console.log('   - Event has details:', !!eventData.details && Object.keys(eventData.details).length > 0);
        console.log('   - Event has template:', !!eventData.templates);
        console.log('   - Template is external:', eventData.templates?.template_type === 'external');
        console.log('   - Has custom RSVP fields:', !!((eventData as any).customFields && (eventData as any).customFields.length > 0));
        console.log('👤 Guest Analysis:');
        console.log('   - Guest invitation status:', guestData.viewed ? 'Viewed' : 'Not viewed');
        console.log('   - Guest RSVP status:', guestData.accepted ? 'Accepted' : 'Pending');
        console.log('   - Guest has submitted data:', !!guestData.rsvp_data);
        console.log('   - Complete RSVP journey:', guestData.viewed && guestData.accepted && guestData.rsvp_data ? 'Complete' : 'Incomplete');
        console.log('🎯 Next Actions:');
        console.log('   - Will load template from:', eventData.templates?.external_url || 'Internal template');
        console.log('   - Guest will see buttons:', {
          accept: !guestData.accepted,
          submit: guestData.accepted && !guestData.rsvp_data && (eventData as any).customFields?.length > 0,
          edit: guestData.accepted && guestData.rsvp_data && eventData.allow_rsvp_edit
        });
        console.log('====================================');

        // Extract template theme from database
        if (eventData.templates?.theme_config) {
          setTemplateTheme(eventData.templates.theme_config);
        }

        // Mark data as ready and construct iframe URL
        setIsDataReady(true);

        // Set up iframe URL
        const baseUrl = getTemplateBaseUrl(eventData.templates);
        console.log('=== URL CONSTRUCTION START ===');
        console.log('Base URL:', baseUrl);
        console.log('Event custom_event_id:', eventData.custom_event_id);
        console.log('Event id:', eventData.id);
        console.log('Guest custom_guest_id:', guestData.custom_guest_id);
        console.log('Guest id:', guestData.id);
        console.log('Event data for URL:', eventData);
        console.log('Guest data for URL:', guestData);
        
        // Safety check before URL construction
        if (!eventData || !guestData) {
          console.error('🚨 CRITICAL: Missing data for URL construction!');
          console.error('eventData exists:', !!eventData);
          console.error('guestData exists:', !!guestData);
          setError('Missing event or guest data for invitation');
          return;
        }
        
        const url = constructInvitationUrl(baseUrl, eventData, guestData, {
          wishesEnabled: String(Boolean((eventData as any).wishes_enabled))
        });
        console.log('Final constructed iframe URL:', url);
        console.log('URL includes eventId:', url.includes('eventId='));
        console.log('URL includes guestId:', url.includes('guestId='));
        console.log('URL has error param:', url.includes('error='));
        console.log('=== URL CONSTRUCTION END ===');
        
        if (url.includes('error=missing_data')) {
          console.error('🚨 URL construction failed - missing data!');
          setError('Failed to construct invitation URL - missing data');
          return;
        }
        
        setIframeUrl(url);

        // Set document title
        if (typeof document !== 'undefined') {
          document.title = `${eventData.name} - Invitation for ${guestData.name}`;
        }

      } catch (error: any) {
        console.error('=== CRITICAL ERROR IN FETCH ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('==============================');
        setError(error.message || 'Failed to load invitation data');
      }
    };

    fetchInvitationData();
  }, [eventId, guestId]);

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    setIframeLoaded(true);
    
    // Mark guest as viewed
    markAsViewed();

    // Send initial data to iframe with comprehensive RSVP status and edge case handling
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow && guest && event) {
      try {
        // Enhanced status detection with edge case handling
        let enhancedGuestStatus: 'pending' | 'viewed' | 'accepted' | 'submitted' = 'pending';
        
        // Simple status detection
        if (guest.accepted && guest.rsvp_data) {
          enhancedGuestStatus = 'submitted';
        } else if (guest.accepted) {
          enhancedGuestStatus = 'accepted';
        } else if (guest.viewed) {
          enhancedGuestStatus = 'viewed';
        }
        // else remains 'pending'
        
        // Use custom IDs consistently for template contract
        const eventId = event.custom_event_id || event.id;
        const guestId = guest.custom_guest_id || guest.id;
        
        console.log('=== POSTMESSAGE ID CHECK ===');
        console.log('Event custom_event_id:', event.custom_event_id);
        console.log('Event id:', event.id);
        console.log('Guest custom_guest_id:', guest.custom_guest_id); 
        console.log('Guest id:', guest.id);
        console.log('Final eventId for postMessage:', eventId);
        console.log('Final guestId for postMessage:', guestId);
        console.log('===========================');
        
        // Validate required IDs exist
        if (!eventId || !guestId) {
          console.error('Missing required IDs:', { eventId, guestId });
          setError('Invalid invitation link - missing event or guest ID');
          return;
        }
        
        // Build flattened invitation data with all RSVP contract fields at top level
        const invitationData = {
          // RSVP Contract Fields (flat at top level)
          eventId: eventId,
          guestId: guestId,
          status: enhancedGuestStatus === 'pending' ? null : enhancedGuestStatus === 'submitted' ? 'submitted' : 'accepted',
          showAcceptButton: enhancedGuestStatus === 'pending',
          showSubmitButton: enhancedGuestStatus === 'accepted' && (event.customFields || []).length > 0,
          showEditButton: enhancedGuestStatus === 'submitted' && (event.allow_rsvp_edit || false),
          rsvpFields: event.customFields || [],
          existingRsvpData: guest.rsvp_data,
          wishesEnabled: Boolean((event as any).wishes_enabled),
          
          // Event details for template rendering
          eventDetails: event.details,
          guestAccess: guestEventAccess,
          
          // Platform metadata (non-contract fields)
          platformData: {
            guestName: guest.name,
            actualStatus: enhancedGuestStatus,
            hasCustomFields: (event.customFields || []).length > 0,
            allowEdit: event.allow_rsvp_edit || false
          }
        };
        
        console.log('📤 ===== TEMPLATE DATA BEING SENT =====');
        console.log('🎨 Template URL:', iframeUrl);
        console.log('📊 Full Invitation Data Object:', invitationData);
        console.log('💒 Event Details to Template:');
        console.log(JSON.stringify(event.details, null, 2));
        console.log('👤 Guest Info to Template:');
        console.log('   - Guest Name:', guest.name);
        console.log('   - Guest Status:', enhancedGuestStatus);
        console.log('   - Has Accepted:', guest.accepted);
        console.log('   - Has RSVP Data:', !!guest.rsvp_data);
        console.log('🎛️ RSVP Configuration:');
        console.log('   - Show Accept Button:', enhancedGuestStatus === 'pending');
        console.log('   - Show Submit Button:', enhancedGuestStatus === 'accepted' && (event.customFields || []).length > 0);
        console.log('   - Show Edit Button:', enhancedGuestStatus === 'submitted' && (event.allow_rsvp_edit || false));
        console.log('   - RSVP Fields Count:', (event.customFields || []).length);
        console.log('   - Existing RSVP Data:', guest.rsvp_data);
        console.log('🔑 Guest Access Data:', guestEventAccess);
        console.log('=====================================');
        
        console.log('Status detection result:', {
          guest_id: guest.id,
          viewed: guest.viewed,
          accepted: guest.accepted,
          has_rsvp_data: !!guest.rsvp_data,
          rsvp_data_keys: guest.rsvp_data ? Object.keys(guest.rsvp_data) : [],
          final_status: enhancedGuestStatus
        });
        
        const message = {
          type: 'INVITATION_LOADED',
          data: invitationData
        };
        
        const targetOrigin = getTemplateBaseUrl(event.templates);
        
        // Send message with retry logic for better reliability
        const sendMessageWithRetry = (attempt = 1) => {
          try {
            if (!iframe.contentWindow) {
              console.error('❌ iframe.contentWindow is null on attempt', attempt);
              return;
            }
            
            iframe.contentWindow.postMessage(message, targetOrigin);
            console.log(`✅ Sent INVITATION_LOADED message (attempt ${attempt}):`, invitationData);
            console.log('📤 Message sent to origin:', targetOrigin);
            console.log('📋 Full message data:', message);
            
            // Retry up to 3 times with increasing delays
            if (attempt < 3) {
              setTimeout(() => sendMessageWithRetry(attempt + 1), attempt * 100);
            }
          } catch (error) {
            console.error(`❌ Failed to send message (attempt ${attempt}):`, error);
            console.error('iframe state:', iframe);
            console.error('iframe.contentWindow:', iframe.contentWindow);
            console.error('targetOrigin:', targetOrigin);
          }
        };
        
        // Add delay before sending message to ensure iframe is ready
        setTimeout(() => {
          console.log('🚀 Starting postMessage communication...');
          sendMessageWithRetry();
        }, 500);
      } catch (error) {
        console.error('Error sending message to iframe:', error);
      }
    }
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load');
    setIframeError(true);
  };

  const retryIframe = () => {
    if (retryCount >= 3) {
      console.log('Maximum retry attempts reached');
      return;
    }

    setRetryCount(prev => prev + 1);
    setIframeError(false);
    setIframeLoaded(false);
    
    // Force iframe reload by changing src
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe && iframeUrl) {
      // Add a cache-busting parameter
      const separator = iframeUrl.includes('?') ? '&' : '?';
      iframe.src = `${iframeUrl}${separator}_retry=${Date.now()}`;
    }
  };

  // Show error state
  if (error || (!isDataReady && error)) {
    return (
      <ErrorBoundary>
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="text-center max-w-md mx-auto p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invitation Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This invitation link may be invalid or expired.'}
            </p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact the event host.
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        {/* Single Enhanced Loading Experience */}
        <EnhancedInvitationLoader
          guestName={guest?.name || 'Guest'}
          eventName={event?.name || 'Special Event'}
          isVisible={!iframeLoaded && !iframeError && isDataReady && !!iframeUrl}
          templateTheme={event?.templates?.theme_config}
          onComplete={() => console.log('Enhanced loader completed')}
        />

        {/* Error overlay */}
        {iframeError && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div className="text-center">
              <p className="text-red-600 mb-4">Failed to load invitation template</p>
              <p className="text-sm text-gray-600 mb-4">
                {retryCount >= 3 ? 'Maximum retries reached. Please refresh the page.' : 'Attempting to reload...'}
              </p>
              {retryCount < 3 && (
                <button 
                  onClick={retryIframe}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Retry ({retryCount + 1}/3)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main iframe - only show when URL is ready */}
        {iframeUrl && (
          <iframe
            key={`${iframeUrl}-${retryCount}`}
            src={iframeUrl}
            style={{
              width: '100vw',
              height: '100vh',
              border: 'none',
              margin: 0,
              padding: 0,
              display: 'block',
              backgroundColor: 'transparent'
            }}
            allow="autoplay; fullscreen; camera; microphone; geolocation"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title={`Invitation for ${guest?.name || 'Guest'}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default GuestInvitationPage;