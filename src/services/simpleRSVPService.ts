import { supabase } from "@/integrations/supabase/client";

export interface InvitationPayload {
  eventId: string;
  guestId: string;
  status: null | "accepted" | "submitted";
  showSubmitButton: boolean;
  showEditButton: boolean;
  rsvpFields: any[];
  existingRsvpData: any;
}

export interface EventStats {
  total: number;
  pending: number;
  viewed: number;
  accepted: number;
  submitted: number;
}

export class SimpleRSVPService {
  /**
   * Get invitation payload for template rendering
   * Following exact "Lovable Modern RSVP System" specification
   */
  static async getInvitationPayload(eventId: string, guestId: string): Promise<InvitationPayload> {
    // Fetch guest & event data
    const { data: guest } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!guest || !event) {
      throw new Error('Guest or event not found');
    }

    // Get custom fields from rsvp_field_definitions
    const { data: customFields } = await supabase
      .from('rsvp_field_definitions')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order');

    const hasCustomFields = customFields && customFields.length > 0;

    let result: InvitationPayload = {
      eventId,
      guestId,
      status: null,
      showSubmitButton: false,
      showEditButton: false,
      rsvpFields: [],
      existingRsvpData: null
    };

    // Set status based on guest state (for acceptance tracking)
    if (guest.accepted && !guest.rsvp_data) {
      result.status = "accepted";
    } else if (guest.accepted && guest.rsvp_data) {
      result.status = "submitted";
    }
    // Status remains null for non-accepted guests

    // Set showSubmitButton independently - show RSVP form when custom fields exist and not yet submitted
    if (hasCustomFields && !guest.rsvp_data) {
      result.showSubmitButton = true;
      result.rsvpFields = customFields || [];
    }

    // Set showEditButton when guest has submitted and editing is allowed
    if (guest.rsvp_data && event.allow_rsvp_edit) {
      result.showEditButton = true;
      result.rsvpFields = customFields || [];
      result.existingRsvpData = guest.rsvp_data;
    }

    return result;
  }

  /**
   * Update guest status with validation
   */
  static async updateGuestStatus(guestId: string, updates: {
    viewed?: boolean;
    viewed_at?: string;
    accepted?: boolean;
    accepted_at?: string;
    rsvp_data?: any;
  }) {
    // Always validate guestId exists
    const { data: guest } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guestId)
      .single();

    if (!guest) {
      throw new Error('Guest not found');
    }

    const { error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', guestId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get simple event statistics with mutually exclusive counts
   */
  static async getEventStats(eventId: string): Promise<EventStats> {
    const { data: guests } = await supabase
      .from('guests')
      .select('viewed, accepted, rsvp_data')
      .eq('event_id', eventId);

    if (!guests) {
      throw new Error('Failed to fetch guest data');
    }

    // Mutually exclusive counts - each guest counted only once
    // Priority: submitted > accepted > viewed > pending
    const submitted = guests.filter(g => g.rsvp_data).length;
    const accepted = guests.filter(g => g.accepted && !g.rsvp_data).length;
    const viewed = guests.filter(g => g.viewed && !g.accepted && !g.rsvp_data).length;
    const pending = guests.filter(g => !g.viewed && !g.accepted && !g.rsvp_data).length;

    return {
      total: guests.length,
      pending,
      viewed,
      accepted,
      submitted
    };
  }

  /**
   * Handle postMessage events from templates
   */
  static async handlePostMessage(message: any): Promise<InvitationPayload | null> {
    const { eventId, guestId } = message.data;
    
    console.log('🔄 SimpleRSVPService processing message:');
    console.log('- Message Type:', message.type);
    console.log('- Event ID:', eventId);
    console.log('- Guest ID:', guestId);
    console.log('- Full message data:', message.data);
    
    // Always validate eventId + guestId
    if (!eventId || !guestId) {
      throw new Error('Missing eventId or guestId');
    }

    // Resolve actual database IDs from custom IDs if needed
    const actualEventId = await this.resolveEventId(eventId);
    const actualGuestId = await this.resolveGuestId(guestId);
    
    console.log('🔍 Resolved IDs:');
    console.log('- Actual Event ID:', actualEventId);
    console.log('- Actual Guest ID:', actualGuestId);

    switch (message.type) {
      case 'INVITATION_VIEWED':
        console.log('📋 Processing INVITATION_VIEWED');
        await this.updateGuestStatus(actualGuestId, { 
          viewed: true, 
          viewed_at: new Date().toISOString() 
        });
        return null; // No payload needed for view tracking

      case 'RSVP_ACCEPTED':
      case 'GUEST_ACCEPTANCE': // Support both message types
        console.log('✅ Processing RSVP_ACCEPTED/GUEST_ACCEPTANCE');
        await this.updateGuestStatus(actualGuestId, { 
          accepted: true, 
          accepted_at: new Date().toISOString() 
        });
        // Return updated payload for template
        return await this.getInvitationPayload(actualEventId, actualGuestId);
        
      case 'RSVP_SUBMITTED':
      case 'RSVP_UPDATED':
      case 'GUEST_RSVP_UPDATE': // Support additional message type
        console.log('📝 Processing RSVP_SUBMITTED/RSVP_UPDATED/GUEST_RSVP_UPDATE');
        await this.updateGuestStatus(actualGuestId, { 
          accepted: true,
          accepted_at: new Date().toISOString(),
          rsvp_data: message.data.rsvpData || message.data.rsvp_data || message.data
        });
        // Return updated payload for template
        return await this.getInvitationPayload(actualEventId, actualGuestId);

      default:
        console.log('❌ Unknown message type:', message.type);
        return null;
    }
  }

  /**
   * Resolve event ID from custom ID to actual database ID
   */
  static async resolveEventId(eventId: string): Promise<string> {
    // First try as actual ID
    const { data: eventById } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();
    
    if (eventById) {
      return eventId; // It's already the actual ID
    }
    
    // Try as custom_event_id
    const { data: eventByCustomId } = await supabase
      .from('events')
      .select('id')
      .eq('custom_event_id', eventId)
      .single();
    
    if (eventByCustomId) {
      return eventByCustomId.id;
    }
    
    throw new Error(`Event not found for ID: ${eventId}`);
  }

  /**
   * Resolve guest ID from custom ID to actual database ID
   */
  static async resolveGuestId(guestId: string): Promise<string> {
    // First try as actual ID
    const { data: guestById } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guestId)
      .single();
    
    if (guestById) {
      return guestId; // It's already the actual ID
    }
    
    // Try as custom_guest_id
    const { data: guestByCustomId } = await supabase
      .from('guests')
      .select('id')
      .eq('custom_guest_id', guestId)
      .single();
    
    if (guestByCustomId) {
      return guestByCustomId.id;
    }
    
    throw new Error(`Guest not found for ID: ${guestId}`);
  }
}