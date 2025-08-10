export interface Guest {
  id: string;
  name: string;
  mobile_number: string;
  event_id: string;
  custom_guest_id?: string;
  viewed?: boolean;
  accepted?: boolean;
  viewed_at?: string;
  accepted_at?: string;
  created_at?: string;
  rsvp_data?: any;
}

export interface Event {
  id: string;
  name: string;
  details: any;
  template?: any;
  templates?: any;
  custom_event_id?: string;
  host_id: string;
  template_id: string;
  page_name: string;
  created_at: string;
  rsvp_config?: any;
  guests?: Guest[]; // Array of Guest objects
  guest_id_for_user?: string; // Added: specific guest ID for the current user
  custom_guest_id_for_user?: string; // Added: specific custom guest ID for the current user
}

export interface Template {
  id: string;
  name: string;
  component_name: string;
  fields: Record<string, any>;
  pages: any;
  template_type?: string;
  external_url?: string;
  thumbnail_url?: string;
  created_at: string;
}

// Template field type
export interface TemplateField {
  type: 'text' | 'textarea' | 'date' | 'time' | 'select' | 'boolean' | 'image' | 'array' | 'object';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  fields?: Record<string, TemplateField>; // For nested fields in arrays or objects
}

// Add missing RSVP types
export interface RSVPField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'phone' | 'date' | 'time' | 'checkbox' | 'radio' | 'file' | 'toggle' | 'datetime' | 'rating' | 'address';
  is_required: boolean;
  field_options?: string[] | { options?: string[]; accept?: string; [key: string]: any };
  placeholder_text?: string;
  validation_rules?: any;
  display_order?: number;
}

export interface RSVPConfig {
  type: 'simple' | 'detailed';
  hasCustomFields?: boolean;
  allowEditAfterSubmit?: boolean;
  customFields?: RSVPField[];
  fields?: RSVPField[]; // Keep for backward compatibility
}

// Add missing template props
export interface TemplateProps {
  eventDetails: any;
  guestName: string;
  onAccept: (rsvpData?: any) => void;
  hasResponded: boolean;
  accepted: boolean;
  rsvpConfig?: RSVPConfig;
}

// Fix RoyalWeddingTemplate props
export interface RoyalInvitationViewProps {
  eventDetails: any;
  guestName: string;
  onAccept: (rsvpData?: any) => void;
  hasResponded: boolean;
  accepted: boolean;
  rsvpConfig?: RSVPConfig;
}