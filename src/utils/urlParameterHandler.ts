/**
 * URL Parameter Handler for Royal Indian Wedding Template
 * Handles data transmission through URL parameters and POST messages
 */

export interface RoyalWeddingData {
  // Couple Details
  groom_name: string;
  bride_name: string;
  groom_city?: string;
  bride_city?: string;
  wedding_date: string;
  wedding_time: string;
  groom_first: boolean;
  couple_image?: string;
  
  // Venue Details
  venue_name: string;
  venue_address: string;
  venue_map_link?: string;
  
  // Family Details
  bride_family_photo?: string;
  bride_parents_names?: string;
  bride_family?: {
    members: Array<{
      name: string;
      relation?: string;
      description?: string;
      photo?: string;
    }>;
  };
  
  groom_family_photo?: string;
  groom_parents_names?: string;
  groom_family?: {
    members: Array<{
      name: string;
      relation?: string;
      description?: string;
      photo?: string;
    }>;
  };
  
  // Contacts
  contacts?: Array<{
    name: string;
    phone: string;
    relation?: string;
  }>;
  
  // Photos
  photos?: Array<{
    photo: string;
    title?: string;
  }>;
  
  // Events
  events?: Array<{
    name: string;
    date: string;
    time: string;
    venue: string;
    description?: string;
    map_link?: string;
  }>;
}

export interface GuestData {
  id: string;
  name: string;
  mobile_number: string;
  viewed: boolean;
  accepted: boolean;
  custom_guest_id?: string;
}

export interface EventData {
  id: string;
  name: string;
  custom_event_id?: string;
  details: RoyalWeddingData;
}

export interface StructuredEventData {
  eventId: string;
  eventName: string;
  guestId: string;
  guestName: string;
  hasResponded: boolean;
  accepted: boolean;
  weddingData: {
    couple: {
      groomName: string;
      brideName: string;
      groomCity: string;
      brideCity: string;
      weddingDate: string;
      weddingTime: string;
      groomFirst: boolean;
      coupleImage: string;
    };
    venue: {
      name: string;
      address: string;
      mapLink: string;
    };
    family: {
      bride: {
        familyPhoto: string;
        parentsNames: string;
        members: Array<{
          name: string;
          relation?: string;
          description?: string;
          photo?: string;
        }>;
      };
      groom: {
        familyPhoto: string;
        parentsNames: string;
        members: Array<{
          name: string;
          relation?: string;
          description?: string;
          photo?: string;
        }>;
      };
    };
    contacts: Array<{
      name: string;
      phone: string;
      relation?: string;
    }>;
    gallery: Array<{
      photo: string;
      title?: string;
    }>;
    events: Array<{
      name: string;
      date: string;
      time: string;
      venue: string;
      description?: string;
      map_link?: string;
    }>;
  };
}

/**
 * Creates a structured JSON object for URL parameter transmission
 */
export const createEventDataForURL = (eventData: EventData, guestData: GuestData): StructuredEventData => {
  const { details } = eventData;
  
  return {
    // Event Metadata
    eventId: eventData.custom_event_id || eventData.id,
    eventName: eventData.name,
    
    // Guest Information
    guestId: guestData.custom_guest_id || guestData.id,
    guestName: guestData.name,
    hasResponded: guestData.accepted !== null,
    accepted: guestData.accepted,
    
    // Wedding Data Structure (matches Royal Indian Wedding template requirements)
    weddingData: {
      couple: {
        groomName: details.groom_name,
        brideName: details.bride_name,
        groomCity: details.groom_city || '',
        brideCity: details.bride_city || '',
        weddingDate: details.wedding_date,
        weddingTime: details.wedding_time,
        groomFirst: details.groom_first,
        coupleImage: details.couple_image || ''
      },
      
      venue: {
        name: details.venue_name,
        address: details.venue_address,
        mapLink: details.venue_map_link || ''
      },
      
      family: {
        bride: {
          familyPhoto: details.bride_family_photo || '',
          parentsNames: details.bride_parents_names || '',
          members: details.bride_family?.members || []
        },
        groom: {
          familyPhoto: details.groom_family_photo || '',
          parentsNames: details.groom_parents_names || '',
          members: details.groom_family?.members || []
        }
      },
      
      contacts: details.contacts || [],
      
      gallery: details.photos || [],
      
      events: details.events || []
    }
  };
};

/**
 * Encodes event data as URL parameters
 */
export const encodeEventDataAsURLParams = (
  eventData: EventData, 
  guestData: GuestData,
  baseUrl: string
): string => {
  const structuredData = createEventDataForURL(eventData, guestData);
  const params = new URLSearchParams();
  
  // Method 1: Single JSON parameter (recommended for complex data)
  params.append('data', encodeURIComponent(JSON.stringify(structuredData)));
  
  // Method 2: Individual parameters (for backwards compatibility)
  params.append('eventId', structuredData.eventId);
  params.append('guestId', structuredData.guestId);
  params.append('guestName', structuredData.guestName);
  params.append('hasResponded', structuredData.hasResponded.toString());
  params.append('accepted', structuredData.accepted.toString());
  
  // Couple details as individual params
  const couple = structuredData.weddingData.couple;
  params.append('groomName', couple.groomName);
  params.append('brideName', couple.brideName);
  params.append('weddingDate', couple.weddingDate);
  params.append('weddingTime', couple.weddingTime);
  params.append('groomFirst', couple.groomFirst.toString());
  
  // Venue details
  const venue = structuredData.weddingData.venue;
  params.append('venueName', venue.name);
  params.append('venueAddress', venue.address);
  if (venue.mapLink) params.append('venueMapLink', venue.mapLink);
  
  // Complex data as JSON strings
  if (structuredData.weddingData.contacts.length > 0) {
    params.append('contacts', JSON.stringify(structuredData.weddingData.contacts));
  }
  
  if (structuredData.weddingData.gallery.length > 0) {
    params.append('photos', JSON.stringify(structuredData.weddingData.gallery));
  }
  
  if (structuredData.weddingData.events.length > 0) {
    params.append('events', JSON.stringify(structuredData.weddingData.events));
  }
  
  if (structuredData.weddingData.family.bride.members.length > 0) {
    params.append('brideFamily', JSON.stringify({
      parentsNames: structuredData.weddingData.family.bride.parentsNames,
      familyPhoto: structuredData.weddingData.family.bride.familyPhoto,
      members: structuredData.weddingData.family.bride.members
    }));
  }
  
  if (structuredData.weddingData.family.groom.members.length > 0) {
    params.append('groomFamily', JSON.stringify({
      parentsNames: structuredData.weddingData.family.groom.parentsNames,
      familyPhoto: structuredData.weddingData.family.groom.familyPhoto,
      members: structuredData.weddingData.family.groom.members
    }));
  }
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Decodes JSON data from URL parameters
 */
export const decodeEventDataFromURLParams = (urlString: string): any => {
  try {
    const url = new URL(urlString);
    const params = new URLSearchParams(url.search);
    
    // Try to get structured data first
    const dataParam = params.get('data');
    if (dataParam) {
      return JSON.parse(decodeURIComponent(dataParam));
    }
    
    // Fallback: reconstruct from individual parameters
    return {
      eventId: params.get('eventId'),
      guestId: params.get('guestId'),
      guestName: params.get('guestName'),
      hasResponded: params.get('hasResponded') === 'true',
      accepted: params.get('accepted') === 'true',
      weddingData: {
        couple: {
          groomName: params.get('groomName'),
          brideName: params.get('brideName'),
          weddingDate: params.get('weddingDate'),
          weddingTime: params.get('weddingTime'),
          groomFirst: params.get('groomFirst') === 'true'
        },
        venue: {
          name: params.get('venueName'),
          address: params.get('venueAddress'),
          mapLink: params.get('venueMapLink')
        },
        contacts: params.get('contacts') ? JSON.parse(params.get('contacts')!) : [],
        gallery: params.get('photos') ? JSON.parse(params.get('photos')!) : [],
        events: params.get('events') ? JSON.parse(params.get('events')!) : [],
        family: {
          bride: params.get('brideFamily') ? JSON.parse(params.get('brideFamily')!) : { members: [] },
          groom: params.get('groomFamily') ? JSON.parse(params.get('groomFamily')!) : { members: [] }
        }
      }
    };
  } catch (error) {
    console.error('Error decoding URL parameters:', error);
    return null;
  }
};

/**
 * POST Message interface for template communication
 */
export interface PostMessagePayload {
  type: 'WEDDING_DATA_TRANSFER' | 'RSVP_UPDATE' | 'USER_INTERACTION';
  data: any;
  timestamp: number;
  source: 'PLATFORM' | 'TEMPLATE';
}

/**
 * Creates a POST message payload for sending to templates
 */
export const createPostMessagePayload = (
  type: PostMessagePayload['type'],
  data: any,
  source: PostMessagePayload['source'] = 'PLATFORM'
): PostMessagePayload => {
  return {
    type,
    data,
    timestamp: Date.now(),
    source
  };
};

/**
 * Sends wedding data to template via POST message
 */
export const sendWeddingDataToTemplate = (
  iframe: HTMLIFrameElement,
  eventData: EventData,
  guestData: GuestData,
  targetOrigin: string = '*'
): void => {
  const structuredData = createEventDataForURL(eventData, guestData);
  const payload = createPostMessagePayload('WEDDING_DATA_TRANSFER', structuredData);
  
  if (iframe.contentWindow) {
    iframe.contentWindow.postMessage(payload, targetOrigin);
    console.log('Sent wedding data to template:', payload);
  }
};

/**
 * Validates incoming POST messages from templates
 */
export const validateIncomingPostMessage = (
  event: MessageEvent,
  allowedOrigins: string[] = ['*']
): boolean => {
  // Check origin
  if (!allowedOrigins.includes('*') && !allowedOrigins.includes(event.origin)) {
    console.warn('Unauthorized origin:', event.origin);
    return false;
  }
  
  // Check message structure
  const { type, data, timestamp, source } = event.data;
  if (!type || !timestamp || !source) {
    console.warn('Invalid message structure:', event.data);
    return false;
  }
  
  return true;
};

/**
 * Handles RSVP updates from templates
 */
export const handleRSVPUpdate = async (
  messageData: any,
  guestId: string,
  updateCallback: (accepted: boolean, rsvpData?: any) => Promise<void>
): Promise<void> => {
  try {
    const { accepted, rsvpData } = messageData;
    await updateCallback(accepted, rsvpData);
    console.log('RSVP updated successfully:', { accepted, rsvpData });
  } catch (error) {
    console.error('Error handling RSVP update:', error);
    throw error;
  }
};

/**
 * Logs data transmission for debugging and reporting
 */
export const logDataTransmission = (
  method: 'URL_PARAMS' | 'POST_MESSAGE',
  direction: 'SENT' | 'RECEIVED',
  dataSize: number,
  dataType: string,
  success: boolean
): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    direction,
    dataSize,
    dataType,
    success,
    userAgent: navigator.userAgent
  };
  
  console.log('Data Transmission Log:', logEntry);
  
  // Store in session storage for reporting
  const logs = JSON.parse(sessionStorage.getItem('dataTransmissionLogs') || '[]');
  logs.push(logEntry);
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100);
  }
  
  sessionStorage.setItem('dataTransmissionLogs', JSON.stringify(logs));
};

/**
 * Gets data transmission logs for reporting
 */
export const getDataTransmissionLogs = (): any[] => {
  return JSON.parse(sessionStorage.getItem('dataTransmissionLogs') || '[]');
};

/**
 * Clears data transmission logs
 */
export const clearDataTransmissionLogs = (): void => {
  sessionStorage.removeItem('dataTransmissionLogs');
};
