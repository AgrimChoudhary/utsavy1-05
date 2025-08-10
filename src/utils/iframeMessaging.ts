/**
 * Utility functions for handling iframe communication with invitation templates
 * Updated according to utsavy2.vercel.app template requirements
 */

// Import removed - using simple status logic now

export interface PostMessageData {
  type: string;
  data?: any;
}

export const MESSAGE_TYPES = {
  INVITATION_VIEWED: 'INVITATION_VIEWED',
  RSVP_ACCEPTED: 'RSVP_ACCEPTED',
  CONTACT_CLICKED: 'CONTACT_CLICKED',
  MAP_CLICKED: 'MAP_CLICKED',
  INVITATION_LOADED: 'INVITATION_LOADED',
  WEDDING_DATA_TRANSFER: 'WEDDING_DATA_TRANSFER',
  TEMPLATE_READY: 'TEMPLATE_READY'
} as const;

/**
 * Send a message to the iframe
 */
export const sendMessageToIframe = (
  iframe: HTMLIFrameElement,
  message: PostMessageData,
  targetOrigin: string = '*'
) => {
  if (iframe.contentWindow) {
    iframe.contentWindow.postMessage(message, targetOrigin);
  }
};

/**
 * Create a secure postMessage listener
 */
export const createPostMessageListener = (
  allowedOrigins: string[],
  onMessage: (type: string, data: any) => void | Promise<void>
) => {
  return (event: MessageEvent) => {
    // Security check: verify origin
    if (!allowedOrigins.some(origin => event.origin === origin || origin === '*')) {
      console.warn('Received message from untrusted origin:', event.origin);
      return;
    }

    const { type, data } = event.data;
    
    if (!type) {
      console.warn('Received message without type:', event.data);
      return;
    }

    // Call the handler
    onMessage(type, data);
  };
};

/**
 * Construct the invitation template URL with all parameters
 * Updated according to utsavy2.vercel.app template specification
 */
export const constructInvitationUrl = (
  baseUrl: string,
  eventData: any,
  guestData: any,
  additionalParams: Record<string, string> = {}
): string => {
  console.log('=== CONSTRUCT INVITATION URL START ===');
  console.log('baseUrl:', baseUrl);
  console.log('eventData:', eventData);
  console.log('guestData:', guestData);
  console.log('eventData type:', typeof eventData);
  console.log('guestData type:', typeof guestData);
  
  // Safety check for undefined data
  if (!eventData || !guestData) {
    console.error('🚨 CRITICAL: eventData or guestData is undefined!');
    console.error('eventData:', eventData);
    console.error('guestData:', guestData);
    return `${baseUrl}?error=missing_data`;
  }
  
  const details = eventData.details || {};
  
  // Check if this is the Royal Wedding template that needs URL parameters
  const isRoyalWeddingTemplate = eventData.template?.component_name === 'RoyalWeddingTemplate' || 
                                 eventData.templates?.component_name === 'RoyalWeddingTemplate' 
                                //  ||  baseUrl.includes('utsavytemplate1.vercel.app');
  
  // Create params object for URL construction
  const params = new URLSearchParams();
  
  if (isRoyalWeddingTemplate) {
    // Royal Wedding template format - uses comprehensive URL parameters
    
    // For Royal Wedding template, use individual URL parameters instead of JSON data
    // Basic couple information
    if (details.groom_name) params.append('groomName', details.groom_name);
    if (details.bride_name) params.append('brideName', details.bride_name);
    if (details.groom_city) params.append('groomCity', details.groom_city);
    if (details.bride_city) params.append('brideCity', details.bride_city);
    if (details.wedding_date) params.append('weddingDate', details.wedding_date);
    if (details.wedding_time) params.append('weddingTime', details.wedding_time);
    
    // Name display order
    const groomFirst = details.groom_first === true || details.groom_first === 'true' || 
                      details.display_order === 'groom';
    params.append('groomFirst', groomFirst.toString());
    
    // Main couple photo
    if (details.couple_image) params.append('couplePhoto', details.couple_image);
    
    // Venue information
    if (details.venue_name) params.append('venueName', details.venue_name);
    if (details.venue_address) params.append('venueAddress', details.venue_address);
    if (details.venue_map_link) params.append('venueMapLink', details.venue_map_link);
    
    // Guest information and RSVP status using centralized service
    params.append('guestName', guestData.name || '');
    
    // Simple status calculation
    const rsvpStatus = guestData.accepted && guestData.rsvp_data ? 'submitted' : guestData.accepted ? 'accepted' : guestData.viewed ? 'viewed' : 'pending';
    
    const finalEventId = eventData.custom_event_id || eventData.id;
    const finalGuestId = guestData.custom_guest_id || guestData.id;
    
    console.log('=== CRITICAL: URL PARAMS FOR ROYAL WEDDING ===');
    console.log('eventData.custom_event_id:', eventData.custom_event_id);
    console.log('eventData.id:', eventData.id);
    console.log('guestData.custom_guest_id:', guestData.custom_guest_id);
    console.log('guestData.id:', guestData.id);
    console.log('Final eventId to be added to URL:', finalEventId);
    console.log('Final guestId to be added to URL:', finalGuestId);
    console.log('============================================');
    
    // Safety check - ensure we have valid IDs
    if (!finalEventId || !finalGuestId) {
      console.error('CRITICAL ERROR: Missing eventId or guestId for URL construction');
      console.error('eventData object:', eventData);
      console.error('guestData object:', guestData);
    }
    
    const urlParams = new URLSearchParams({
      eventId: finalEventId,
      guestId: finalGuestId,
      guestStatus: rsvpStatus
    });
    
    // Add RSVP status parameters  
    urlParams.forEach((value, key) => {
      if (value && !params.has(key)) {
        params.append(key, value);
        console.log(`✅ Added ${key}=${value} to Royal Wedding template URL`);
      }
    });
    
    // Add additional status parameters for template compatibility
    params.append('hasResponded', guestData.accepted ? 'true' : 'false');
    params.append('accepted', guestData.accepted ? 'true' : 'false');
    
    // Force add eventId and guestId if not already added
    if (!params.has('eventId') && finalEventId) {
      params.append('eventId', finalEventId);
      console.log('🔧 Force added eventId to Royal Wedding URL:', finalEventId);
    }
    if (!params.has('guestId') && finalGuestId) {
      params.append('guestId', finalGuestId);
      console.log('🔧 Force added guestId to Royal Wedding URL:', finalGuestId);
    }
    
    // Family information - encode as JSON parameters
    if (details.bride_family?.members && details.bride_family.members.length > 0) {
      const brideFamily = {
        title: 'Bride\'s Family',
        familyPhoto: details.bride_family_photo || '',
        parentsNames: details.bride_parents_names || '',
        members: details.bride_family.members.map((member: any, index: number) => ({
          id: member.id || `bride-family-${index}`,
          name: member.name || '',
          relation: member.relation || '',
          photo: member.photo || '',
          description: member.description || ''
        }))
      };
      params.append('brideFamily', encodeURIComponent(JSON.stringify(brideFamily)));
    }
    
    if (details.groom_family?.members && details.groom_family.members.length > 0) {
      const groomFamily = {
        title: 'Groom\'s Family',
        familyPhoto: details.groom_family_photo || '',
        parentsNames: details.groom_parents_names || '',
        members: details.groom_family.members.map((member: any, index: number) => ({
          id: member.id || `groom-family-${index}`,
          name: member.name || '',
          relation: member.relation || '',
          photo: member.photo || '',
          description: member.description || ''
        }))
      };
      params.append('groomFamily', encodeURIComponent(JSON.stringify(groomFamily)));
    }
    
    // Photo gallery
    if (details.photos && Array.isArray(details.photos) && details.photos.length > 0) {
      const photos = details.photos.map((photo: any, index: number) => ({
        id: photo.id || `photo-${index}`,
        url: photo.photo || photo.src || photo.url || '',
        title: photo.title || `Photo ${index + 1}`
      })).filter(photo => photo.url);
      
      if (photos.length > 0) {
        params.append('photos', encodeURIComponent(JSON.stringify(photos)));
      }
    }
    
    // Events information
    if (details.events && Array.isArray(details.events) && details.events.length > 0) {
      const events = details.events.map((event: any, index: number) => ({
        id: event.id || `event-${index}`,
        name: event.name || '',
        date: event.date || '',
        time: event.time || '',
        venue: event.venue || '',
        description: event.description || '',
        mapLink: event.map_link || ''
      }));
      params.append('events', encodeURIComponent(JSON.stringify(events)));
    }
    
    // Contact information
    if (details.contacts && Array.isArray(details.contacts) && details.contacts.length > 0) {
      const contacts = details.contacts.map((contact: any, index: number) => ({
        id: contact.id || `contact-${index}`,
        name: contact.name || '',
        phone: contact.phone || '',
        relation: contact.relation || ''
      }));
      params.append('contacts', encodeURIComponent(JSON.stringify(contacts)));
    }
    
    // RSVP configuration - ensure proper format and always include type
    let rsvpConfig = { type: 'simple' }; // Default fallback
    if (eventData.rsvp_config) {
      if (typeof eventData.rsvp_config === 'object' && eventData.rsvp_config.type) {
        rsvpConfig = eventData.rsvp_config;
      } else if (typeof eventData.rsvp_config === 'string') {
        try {
          const parsed = JSON.parse(eventData.rsvp_config);
          if (parsed && parsed.type) {
            rsvpConfig = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse rsvp_config:', eventData.rsvp_config);
        }
      }
    }
    console.log('Sending RSVP config in URL for Royal Wedding template:', rsvpConfig);
    params.append('rsvpConfig', encodeURIComponent(JSON.stringify(rsvpConfig)));
    
    // Custom RSVP fields for detailed forms
    if (eventData.customFields && Array.isArray(eventData.customFields) && eventData.customFields.length > 0) {
      console.log('Sending custom RSVP fields to template:', eventData.customFields);
      params.append('customFields', encodeURIComponent(JSON.stringify(eventData.customFields)));
    }

    // Add existing RSVP data to URL for template compatibility
    if (guestData.rsvp_data && Object.keys(guestData.rsvp_data).length > 0) {
      console.log('Sending existing RSVP data to template:', guestData.rsvp_data);
      params.append('existingRsvpData', encodeURIComponent(JSON.stringify(guestData.rsvp_data)));
    }
    
    // Legacy weddingData structure for backward compatibility (if needed)
    const couplePhotoUrl = details.couple_image || '';
    const weddingData = {
      couple: {
        groomFirstName: details.groom_name || '',
        brideFirstName: details.bride_name || '',
        groomCity: details.groom_city || '',
        brideCity: details.bride_city || '',
        couplePhotoUrl: couplePhotoUrl,
        groomFirst: groomFirst
      },
      family: {
        groomFamily: details.groom_family ? {
          title: details.groom_family.title || 'Groom\'s Family',
          members: Array.isArray(details.groom_family.members) ? 
            details.groom_family.members.map((member: any, index: number) => ({
              id: member.id || `groom-family-${index}`,
              name: member.name || '',
              relation: member.relation || '',
              image: member.photo || '',
              description: member.description || '',
              showInDialogOnly: member.showInDialogOnly || false
            })) : []
        } : { title: 'Groom\'s Family', members: [] },
        brideFamily: details.bride_family ? {
          title: details.bride_family.title || 'Bride\'s Family',
          members: Array.isArray(details.bride_family.members) ? 
            details.bride_family.members.map((member: any, index: number) => ({
              id: member.id || `bride-family-${index}`,
              name: member.name || '',
              relation: member.relation || '',
              image: member.photo || '',
              description: member.description || '',
              showInDialogOnly: member.showInDialogOnly || false
            })) : []
        } : { title: 'Bride\'s Family', members: [] }
      },
      mainWedding: {
        date: details.wedding_date || '',
        time: details.wedding_time || '',
        venue: {
          name: details.venue_name || details.venue || '',
          address: details.venue_address || details.address || '',
          mapLink: details.venue_map_link || details.map_link || ''
        }
      },
      events: Array.isArray(details.events) ? 
        details.events.map((event: any, index: number) => ({
          id: event.id || `event-${index}`,
          name: event.name || '',
          date: event.date || '',
          time: event.time || '',
          venue: event.venue || '',
          address: event.address || '',
          mapLink: event.map_link || event.mapLink || '',
          description: event.description || ''
        })) : [],
      photoGallery: Array.isArray(details.photos) ? 
        details.photos.map((photo: any, index: number) => {
          // Handle different photo formats
          let photoUrl = '';
          if (typeof photo === 'string') {
            photoUrl = photo;
          } else if (photo.src) {
            photoUrl = photo.src;
          } else if (photo.url) {
            photoUrl = photo.url;
          } else {
            // Try to extract URL from object if it's in a different format
            const values = Object.values(photo);
            if (values.length > 0 && typeof values[0] === 'string') {
              photoUrl = values[0] as string;
            }
          }
          
          return {
            id: photo.id || `photo-${index}`,
            url: photoUrl,
            title: photo.title || photo.alt || `Photo ${index + 1}`,
            description: photo.description || ''
          };
        }) : [],
      contacts: Array.isArray(details.contacts) ? 
        details.contacts.map((contact: any, index: number) => ({
          id: contact.id || `contact-${index}`,
          name: contact.name || '',
          relation: contact.relation || '',
          phone: contact.phone || contact.number || ''
        })) : []
    };
    
    // Add legacy weddingData parameter for backward compatibility (optional)
    // params.append('weddingData', encodeURIComponent(JSON.stringify(weddingData)));
    
    // Add preview mode parameters if applicable
    if (additionalParams.preview) {
      params.append('preview', additionalParams.preview);
    }
    if (additionalParams.isHeroPreview) {
      params.append('isHeroPreview', additionalParams.isHeroPreview);
    }
    
    // Add any additional custom parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value && key !== 'preview' && key !== 'isHeroPreview') {
        params.append(key, value);
      }
    });
  } else {
    // Default template handling for utsavy.vercel.app (new) or utsavy2.vercel.app (original) templates
    // Also handles any other external templates that follow the same structure
    console.log('🎯 Using default template format for URL:', baseUrl);
    
    // Basic Couple Information
    if (details.bride_name) params.append('brideName', details.bride_name);
    if (details.groom_name) params.append('groomName', details.groom_name);
    if (details.wedding_date) params.append('weddingDate', details.wedding_date);
    if (details.wedding_time) params.append('weddingTime', details.wedding_time);
    if (details.couple_tagline) params.append('coupleTagline', details.couple_tagline);
    
    // Display order - handle all possible formats and ensure boolean conversion
    let groomFirst = false;
    if (details.groom_first === true || details.groom_first === 'true' || details.groom_first === 'Groom First') {
      groomFirst = true;
    } else if (details.display_order === 'groom') {
      groomFirst = true;
    }
    params.append('groomFirst', groomFirst.toString());
    
    // Guest name
    if (guestData.name) params.append('guestName', guestData.name);
    
    // Simple status calculation  
    const rsvpStatus = guestData.accepted && guestData.rsvp_data ? 'submitted' : guestData.accepted ? 'accepted' : guestData.viewed ? 'viewed' : 'pending';
    
    const finalEventId = eventData.custom_event_id || eventData.id;
    const finalGuestId = guestData.custom_guest_id || guestData.id;
    
    console.log('=== CRITICAL: URL PARAMS FOR UTSAVY TEMPLATE ===');
    console.log('eventData.custom_event_id:', eventData.custom_event_id);
    console.log('eventData.id:', eventData.id);
    console.log('guestData.custom_guest_id:', guestData.custom_guest_id);
    console.log('guestData.id:', guestData.id);
    console.log('Final eventId to be added to URL:', finalEventId);
    console.log('Final guestId to be added to URL:', finalGuestId);
    console.log('==============================================');
    
    // Safety check - ensure we have valid IDs
    if (!finalEventId || !finalGuestId) {
      console.error('CRITICAL ERROR: Missing eventId or guestId for URL construction (UTSAVY)');
      console.error('eventData object:', eventData);
      console.error('guestData object:', guestData);
    }
    
    const urlParams = new URLSearchParams({
      eventId: finalEventId,
      guestId: finalGuestId,
      guestStatus: rsvpStatus
    });
    
    // Add RSVP status parameters for button state control
    urlParams.forEach((value, key) => {
      if (value && !params.has(key)) {
        params.append(key, value);
        console.log(`✅ Added ${key}=${value} to Utsavy template URL`);
      }
    });
    
    // Add additional status parameters for template compatibility
    params.append('hasResponded', guestData.accepted ? 'true' : 'false');
    params.append('accepted', guestData.accepted ? 'true' : 'false');
    
    // Force add eventId and guestId if not already added
    if (!params.has('eventId') && finalEventId) {
      params.append('eventId', finalEventId);
      console.log('🔧 Force added eventId to Utsavy URL:', finalEventId);
    }
    if (!params.has('guestId') && finalGuestId) {
      params.append('guestId', finalGuestId);
      console.log('🔧 Force added guestId to Utsavy URL:', finalGuestId);
    }
    
    // Venue Information (Main venue details)
    if (details.venue_name || details.venue) {
      params.append('venueName', details.venue_name || details.venue);
    }
    if (details.venue_address || details.address) {
      params.append('venueAddress', details.venue_address || details.address);
    }
    if (details.venue_map_link || details.map_link) {
      params.append('venueMapLink', details.venue_map_link || details.map_link);
    }
    
    // Contact Information - JSON encoded array
    if (details.contacts && Array.isArray(details.contacts) && details.contacts.length > 0) {
      const contacts = details.contacts
        .filter((contact: any) => contact && (contact.name || contact.phone || contact.number))
        .map((contact: any) => ({
          name: contact.name || '',
          number: contact.phone || contact.number || ''
        }));
      
      if (contacts.length > 0) {
        params.append('contacts', JSON.stringify(contacts));
      }
    }
    
    // Photos - Comma-separated image URLs
    if (details.photos && Array.isArray(details.photos) && details.photos.length > 0) {
      const photoUrls = details.photos
        .map((photo: any) => {
          if (typeof photo === 'string') return photo;
          return photo.src || photo.url || '';
        })
        .filter((url: string) => url && url.trim() !== '');
      
      if (photoUrls.length > 0) {
        params.append('photos', photoUrls.join(','));
      }
    }
    
    // Events - JSON encoded array with guest-specific filtering
    if (details.events && Array.isArray(details.events) && details.events.length > 0) {
      // Filter events based on guest access
      let filteredEvents = [...details.events];
      
      const events = filteredEvents
        .filter((event: any) => event && event.name)
        .map((event: any) => ({
          name: event.name || '',
          date: event.date || '',
          time: event.time || '',
          venue: event.venue || '',
          mapLink: event.map_link || event.mapLink || ''
        }));
      
      if (events.length > 0) {
        params.append('events', JSON.stringify(events));
      }
    }
    
    // Family Information - JSON encoded objects
    if (details.bride_family && details.bride_family.members && Array.isArray(details.bride_family.members) && details.bride_family.members.length > 0) {
      const brideFamily = {
        title: details.bride_family.title || 'Bride\'s Family',
        members: details.bride_family.members
          .filter((member: any) => member && member.name)
          .map((member: any) => ({
            name: member.name || '',
            relation: member.relation || '',
            photo: member.photo || ''
          }))
      };
      
      if (brideFamily.members.length > 0) {
        params.append('brideFamily', JSON.stringify(brideFamily));
      }
    }
    
    if (details.groom_family && details.groom_family.members && Array.isArray(details.groom_family.members) && details.groom_family.members.length > 0) {
      const groomFamily = {
        title: details.groom_family.title || 'Groom\'s Family',
        members: details.groom_family.members
          .filter((member: any) => member && member.name)
          .map((member: any) => ({
            name: member.name || '',
            relation: member.relation || '',
            photo: member.photo || ''
          }))
      };
      
      if (groomFamily.members.length > 0) {
        params.append('groomFamily', JSON.stringify(groomFamily));
      }
    }
    
    // Tracking IDs
    const trackingEventId = eventData.custom_event_id || eventData.id;
    const trackingGuestId = guestData.custom_guest_id || guestData.id;
    
    console.log('=== TRACKING IDS SECTION ===');
    console.log('trackingEventId:', trackingEventId);
    console.log('trackingGuestId:', trackingGuestId);
    console.log('Will add to params:', { eventId: trackingEventId, guestId: trackingGuestId });
    
    if (!trackingEventId || !trackingGuestId) {
      console.error('CRITICAL: Missing tracking IDs!');
      console.error('trackingEventId:', trackingEventId);
      console.error('trackingGuestId:', trackingGuestId);
      console.error('Original eventData:', eventData);
      console.error('Original guestData:', guestData);
    }
    console.log('===========================');
    
    if (trackingEventId) {
      params.append('eventId', trackingEventId);
      console.log('✅ Added eventId to params:', trackingEventId);
    } else {
      console.error('❌ No eventId to add to params');
    }
    if (trackingGuestId) {
      params.append('guestId', trackingGuestId);
      console.log('✅ Added guestId to params:', trackingGuestId);
    } else {
      console.error('❌ No guestId to add to params');
    }
    
    // RSVP Configuration - ensure proper format and always include type
    let rsvpConfig = { type: 'simple' }; // Default fallback
    if (eventData.rsvp_config) {
      if (typeof eventData.rsvp_config === 'object' && eventData.rsvp_config.type) {
        rsvpConfig = eventData.rsvp_config;
      } else if (typeof eventData.rsvp_config === 'string') {
        try {
          const parsed = JSON.parse(eventData.rsvp_config);
          if (parsed && parsed.type) {
            rsvpConfig = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse rsvp_config:', eventData.rsvp_config);
        }
      }
    }
    console.log('Sending RSVP config in URL for utsavy template:', rsvpConfig);
    params.append('rsvpConfig', encodeURIComponent(JSON.stringify(rsvpConfig)));
    
    // Add existing RSVP data to URL for template compatibility
    if (guestData.rsvp_data && Object.keys(guestData.rsvp_data).length > 0) {
      console.log('Sending existing RSVP data to template:', guestData.rsvp_data);
      params.append('existingRsvpData', encodeURIComponent(JSON.stringify(guestData.rsvp_data)));
    }
    
    // Preview mode parameters
    if (additionalParams.preview) {
      params.append('preview', additionalParams.preview);
    }
    
    // Hero preview mode (simplified visual-only version)
    if (additionalParams.isHeroPreview) {
      params.append('isHeroPreview', additionalParams.isHeroPreview);
    }
    
    // Additional custom parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value && key !== 'preview' && key !== 'isHeroPreview') {
        params.append(key, value);
      }
    });
  }

  const constructedUrl = `${baseUrl}?${params.toString()}`;
  
  // Log for debugging
  console.log('Constructing invitation URL:', {
    baseUrl,
    isRoyalWeddingTemplate,
    templateType: isRoyalWeddingTemplate ? 'Royal Wedding (URL params)' : 'Default Template (individual params)',
    constructedUrl: constructedUrl.substring(0, 100) + '...' // Truncate for readability
  });
  
  // Debug event details in URL construction
  console.log('=== URL CONSTRUCTION DEBUG ===');
  console.log('Event details object:', details);
  console.log('Has bride_name:', !!details.bride_name);
  console.log('Has groom_name:', !!details.groom_name);
  console.log('Has wedding_date:', !!details.wedding_date);
  console.log('All URL params:', params.toString());
  
  // Critical check: Ensure eventId and guestId are in URL
  const urlHasEventId = constructedUrl.includes('eventId=');
  const urlHasGuestId = constructedUrl.includes('guestId=');
  
  console.log('🔍 FINAL URL VALIDATION:');
  console.log('URL contains eventId:', urlHasEventId);
  console.log('URL contains guestId:', urlHasGuestId);
  console.log('Full constructed URL:', constructedUrl);
  
  if (!urlHasEventId || !urlHasGuestId) {
    console.error('🚨 CRITICAL: URL missing required parameters!');
    console.error('eventId in URL:', urlHasEventId);
    console.error('guestId in URL:', urlHasGuestId);
  }
  console.log('==============================');

  return constructedUrl;
};

/**
 * Get the appropriate base URL for a template
 */
export const getTemplateBaseUrl = (template: any): string => {
  if (template?.template_type === 'external' && template?.external_url) {
    console.log("agamon" + template.external_url)
    return template.external_url;
  }
  // Default fallback for backwards compatibility
  return 'https://utsavy2.vercel.app';
};

/**
 * Get allowed origins for postMessage communication
 */
export const getAllowedOrigins = (template: any): string[] => {
  // Always include the current origin and known template domains
  const origins = [
    window.location.origin, 
    'https://utsavy2.vercel.app',
    'https://utsavytemplate1.vercel.app'
  ];
  
  if (template?.template_type === 'external' && template?.external_url) {
    try {
      const url = new URL(template.external_url);
      origins.push(url.origin);
    } catch (error) {
      console.warn('Invalid external_url:', template.external_url);
    }
  }
  
  return origins;
};

/**
 * Log iframe communication for debugging
 */
export const logIframeMessage = (type: string, data: any, direction: 'sent' | 'received') => {
  console.log(`[Iframe ${direction}]`, type, data);
};