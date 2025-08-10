# Complete RSVP Communication Guide for Template Teams

## Overview

This guide provides comprehensive documentation for RSVP communication between the Utsavy platform and invitation templates. It covers all data flows, message formats, and implementation requirements for proper RSVP functionality.

## Communication Architecture

```
Platform Dashboard → Event Database → URL Parameters + PostMessage → Template iframe → PostMessage Response → Platform
```

## Data Transfer Methods

### 1. URL Parameters (Primary Method)
Templates receive initial data through URL parameters when the invitation loads:

```
https://template-url.com/invitation?
  eventId=ABC123&
  guestId=XYZ789&
  rsvpConfig={"type":"detailed"}&
  guestStatus=pending&
  hasResponded=false&
  accepted=false&
  viewed=false&
  customFieldsSubmitted=false&
  hasCustomFields=true&
  canSubmitRsvp=true&
  canEditRsvp=false&
  showSubmitButton=true&
  showEditButton=false&
  allowEditAfterSubmit=true&
  customFields=[{...}]&
  existingRsvpData={...}
```

### 2. PostMessage API (Secondary Method)
The platform sends an `INVITATION_LOADED` message after the iframe loads for dynamic updates:

```javascript
window.postMessage({
  type: 'INVITATION_LOADED',
  data: {
    // Complete RSVP status data (see below)
  }
}, 'https://template-domain.com');
```

## RSVP Configuration Types

### Simple RSVP (`type: "simple"`)
- Only Accept button
- No additional form fields
- Direct acceptance

### Detailed RSVP (`type: "detailed"`)
- Accept button
- Custom form fields when accepting
- Additional data collection

## Guest Status Flow

### Status Progression:
1. **`pending`** → Guest hasn't viewed invitation yet
2. **`viewed`** → Guest viewed invitation but hasn't responded
3. **`accepted`** → Guest accepted (simple RSVP) OR accepted but hasn't submitted custom fields (detailed RSVP)
4. **`submitted`** → Guest completed all required RSVP steps

## Complete Data Structure

### INVITATION_LOADED PostMessage Data
```javascript
{
  type: 'INVITATION_LOADED',
  data: {
    // Legacy compatibility
    guestViewed: boolean,
    guestAccepted: boolean,
    eventName: string,
    guestName: string,
    
    // Enhanced RSVP status (NEW - CRITICAL FOR BUTTONS)
    guestStatus: 'pending' | 'viewed' | 'accepted' | 'submitted',
    hasResponded: boolean,
    accepted: boolean,
    viewed: boolean,
    custom_fields_submitted: boolean,
    
    // RSVP configuration
    rsvpConfig: {
      type: 'simple' | 'detailed',
      allowEditAfterSubmit?: boolean,
      customFields?: Array<RSVPField>,
      fields?: Array<RSVPField>
    },
    hasCustomFields: boolean,
    allowEditAfterSubmit: boolean,
    
    // UI control flags - CRITICAL FOR BUTTON STATE
    canSubmitRsvp: boolean,    // Can show Accept or Submit buttons
    canEditRsvp: boolean,      // Can edit existing RSVP
    showSubmitButton: boolean, // Show "Submit RSVP Details" button
    showEditButton: boolean,   // Show "Edit RSVP Details" button
    
    // RSVP data
    rsvpData: any,            // Existing RSVP form data
    existingRsvpData: any,    // Same as rsvpData (backward compatibility)
    
    // Custom fields for forms
    customFields: Array<RSVPField>,
    
    // Timestamps
    viewed_at: string | null,
    accepted_at: string | null,
    custom_fields_submitted_at: string | null,
    
    // Identifiers
    guestId: string,
    eventId: string
  }
}
```

### RSVPField Interface
```javascript
{
  id: string,
  field_name: string,
  field_label: string,
  field_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number',
  is_required: boolean,
  placeholder_text?: string,
  field_options?: {
    options?: Array<{label: string, value: string}>
  },
  validation_rules?: {
    min?: number,
    max?: number,
    pattern?: string
  },
  display_order: number
}
```

## Template Implementation Requirements

### 1. Parse URL Parameters
```javascript
function parseRSVPConfig() {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    eventId: urlParams.get('eventId'),
    guestId: urlParams.get('guestId'),
    guestStatus: urlParams.get('guestStatus') || 'pending',
    hasResponded: urlParams.get('hasResponded') === 'true',
    accepted: urlParams.get('accepted') === 'true',
    viewed: urlParams.get('viewed') === 'true',
    customFieldsSubmitted: urlParams.get('customFieldsSubmitted') === 'true',
    hasCustomFields: urlParams.get('hasCustomFields') === 'true',
    canSubmitRsvp: urlParams.get('canSubmitRsvp') === 'true',
    canEditRsvp: urlParams.get('canEditRsvp') === 'true',
    showSubmitButton: urlParams.get('showSubmitButton') === 'true',
    showEditButton: urlParams.get('showEditButton') === 'true',
    allowEditAfterSubmit: urlParams.get('allowEditAfterSubmit') === 'true',
    rsvpConfig: JSON.parse(decodeURIComponent(urlParams.get('rsvpConfig') || '{"type":"simple"}')),
    customFields: JSON.parse(decodeURIComponent(urlParams.get('customFields') || '[]')),
    existingRsvpData: JSON.parse(decodeURIComponent(urlParams.get('existingRsvpData') || 'null'))
  };
}
```

### 2. Handle PostMessage Events
```javascript
window.addEventListener('message', (event) => {
  // Verify origin for security
  if (event.origin !== 'https://platform-domain.com') {
    return;
  }
  
  if (event.data.type === 'INVITATION_LOADED') {
    const rsvpData = event.data.data;
    updateRSVPInterface(rsvpData);
  }
});

function updateRSVPInterface(data) {
  // Update all RSVP state based on received data
  updateButtonVisibility(data);
  updateFormFields(data);
  updateGuestStatus(data);
}
```

### 3. Button Visibility Logic (CRITICAL)
```javascript
function updateButtonVisibility(data) {
  const {
    guestStatus,
    canSubmitRsvp,
    canEditRsvp,
    showSubmitButton,
    showEditButton,
    hasCustomFields,
    rsvpConfig
  } = data;

  // Hide all buttons initially
  hideAllButtons();

  switch (guestStatus) {
    case 'pending':
    case 'viewed':
      if (canSubmitRsvp) {
        showAcceptButton();
      }
      break;
      
    case 'accepted':
      if (hasCustomFields && showSubmitButton) {
        showSubmitRSVPDetailsButton();
      }
      if (canEditRsvp && showEditButton) {
        showEditRSVPButton();
      }
      break;
      
    case 'submitted':
      if (canEditRsvp && showEditButton) {
        showEditRSVPButton();
      }
      showThankYouMessage();
      break;
  }
}

function showAcceptButton() {
  document.getElementById('accept-btn').style.display = 'block';
}

function showSubmitRSVPDetailsButton() {
  document.getElementById('submit-rsvp-details-btn').style.display = 'block';
}

function showEditRSVPButton() {
  document.getElementById('edit-rsvp-btn').style.display = 'block';
}

function hideAllButtons() {
  const buttons = ['accept-btn', 'submit-rsvp-details-btn', 'edit-rsvp-btn'];
  buttons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
```

### 4. Handle Form Field Types
```javascript
function renderCustomFields(fields, existingData = {}) {
  const container = document.getElementById('custom-fields-container');
  container.innerHTML = '';

  fields.forEach(field => {
    const fieldElement = createFieldElement(field, existingData[field.field_name]);
    container.appendChild(fieldElement);
  });
}

function createFieldElement(field, existingValue = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'field-wrapper';

  const label = document.createElement('label');
  label.textContent = field.field_label + (field.is_required ? ' *' : '');
  wrapper.appendChild(label);

  let input;
  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'number':
      input = document.createElement('input');
      input.type = field.field_type;
      input.value = existingValue;
      input.placeholder = field.placeholder_text || '';
      break;
      
    case 'textarea':
      input = document.createElement('textarea');
      input.value = existingValue;
      input.placeholder = field.placeholder_text || '';
      break;
      
    case 'select':
      input = document.createElement('select');
      field.field_options?.options?.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        optionEl.selected = existingValue === option.value;
        input.appendChild(optionEl);
      });
      break;
  }

  input.name = field.field_name;
  input.required = field.is_required;
  wrapper.appendChild(input);

  return wrapper;
}
```

### 5. Send Responses to Platform
```javascript
// Accept invitation
function acceptInvitation() {
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId
    }
  }, '*');
}


// Submit detailed RSVP form
function submitDetailedRSVP(formData) {
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId,
      rsvpData: formData  // Include custom form data
    }
  }, '*');
}

// Request edit mode (for submitted RSVPs)
function requestEditMode() {
  window.parent.postMessage({
    type: 'RSVP_EDIT_REQUEST',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId
    }
  }, '*');
}
```

## Security Considerations

### Origin Verification
```javascript
const TRUSTED_ORIGINS = [
  'https://56d76d10-3326-4860-9418-d8552aeee4c9.lovableproject.com',
  'https://your-platform-domain.com'
];

window.addEventListener('message', (event) => {
  if (!TRUSTED_ORIGINS.includes(event.origin)) {
    console.warn('Message from untrusted origin:', event.origin);
    return;
  }
  // Process message
});
```

### Data Validation
```javascript
function validateRSVPData(data) {
  if (!data.guestId || !data.eventId) {
    throw new Error('Missing required identifiers');
  }
  
  if (data.rsvpData) {
    // Validate form data against field definitions
    validateFormData(data.rsvpData, customFields);
  }
}
```

## Error Handling

### Graceful Fallbacks
```javascript
function initializeRSVP() {
  try {
    // Try URL parameters first
    const urlData = parseRSVPConfig();
    setupRSVPInterface(urlData);
    
    // Listen for postMessage updates
    setupPostMessageListener();
    
  } catch (error) {
    console.error('RSVP initialization error:', error);
    showFallbackInterface();
  }
}

function showFallbackInterface() {
  // Show basic accept button
  document.getElementById('fallback-rsvp').style.display = 'block';
}
```

## Testing Checklist for Template Teams

### Basic Functionality
- [ ] URL parameters are parsed correctly
- [ ] PostMessage events are received and processed
- [ ] Button visibility changes based on guest status
- [ ] Form fields render correctly for detailed RSVP
- [ ] Responses are sent back to platform successfully

### Status Transitions
- [ ] `pending` → shows Accept button
- [ ] `viewed` → shows Accept button  
- [ ] `accepted` (with custom fields) → shows "Submit RSVP Details" button
- [ ] `accepted` (simple RSVP) → shows thank you message
- [ ] `submitted` → shows thank you + edit button (if allowed)

### Edge Cases
- [ ] Page refresh maintains correct button state
- [ ] Missing or invalid URL parameters are handled gracefully
- [ ] Network failures don't break the interface
- [ ] Invalid postMessage data is ignored safely

### Security
- [ ] Origin verification is implemented
- [ ] Data validation prevents XSS attacks
- [ ] Sensitive data is not logged to console

## Platform Requirements Met

✅ **Database Schema**: No changes needed - all required fields exist:
- `guests.custom_fields_submitted` (boolean)
- `guests.accepted` (boolean) 
- `guests.viewed` (boolean)
- `guests.rsvp_data` (jsonb)
- `guests.status` (varchar)
- `events.rsvp_config` (jsonb)
- `rsvp_field_definitions` (table)

✅ **Backend Services**: New `rsvpStatusService.ts` centralizes status calculation

✅ **PostMessage Enhancement**: `INVITATION_LOADED` now includes all required data

✅ **URL Parameters**: Enhanced with complete RSVP status information

## Key Changes Made to Platform

1. **Created `rsvpStatusService.ts`** - Centralizes RSVP status calculation
2. **Enhanced `GuestInvitationPage.tsx`** - Sends complete RSVP data via postMessage
3. **Updated `iframeMessaging.ts`** - Uses new service for consistent URL parameters

## Critical Implementation Notes

### For Template Teams:
1. **ALWAYS use the new status flags** (`showSubmitButton`, `showEditButton`, `canSubmitRsvp`, `canEditRsvp`)
2. **Button visibility MUST be based on `guestStatus` and these flags**
3. **Handle both URL parameters and postMessage for redundancy**
4. **Validate all data before using it**

### For Platform Team:
1. **All database fields already exist** - no migrations needed
2. **New service handles all status calculations consistently**
3. **Templates will receive complete data on every page load**

This implementation ensures that RSVP buttons display correctly after page refresh and provides templates with all necessary data for proper RSVP handling.