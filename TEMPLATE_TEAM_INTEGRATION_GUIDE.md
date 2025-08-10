# Template Team Integration Guide - RSVP Configuration Support

## Overview

The platform now supports dynamic RSVP configuration. Templates must adapt their RSVP interface based on platform direction - either showing a simple "Accept Invitation" button or a detailed RSVP form.

## RSVP Configuration Data Structure

The platform sends RSVP configuration through URL parameters and PostMessage:

### URL Parameter (Recommended)
```javascript
// Example URL parameter
?rsvpConfig={encoded_json_config}

// Decoded structure:
{
  "type": "simple" | "detailed",
  "fields": [
    {
      "name": "attendees",
      "label": "Number of Attendees",
      "type": "number",
      "required": true,
      "placeholder": "1"
    },
    {
      "name": "dietary_requirements", 
      "label": "Dietary Requirements",
      "type": "select",
      "required": false,
      "options": ["None", "Vegetarian", "Vegan", "Gluten-free"]
    }
  ]
}
```

### PostMessage Data
```javascript
// INVITATION_LOADED message now includes RSVP config
{
  type: 'INVITATION_LOADED',
  data: {
    eventId: 'ABC123',
    guestId: 'XYZ789', 
    guestName: 'John Doe',
    hasResponded: false,
    accepted: false,
    rsvpConfig: {
      type: 'detailed',
      fields: [...]
    },
    eventData: { /* event details */ }
  }
}
```

## Implementation Requirements

### 1. RSVP Configuration Types

#### Simple RSVP (`type: "simple"`)
- Show single "Accept Invitation" button
- No additional form fields
- Direct acceptance without extra data collection

#### Detailed RSVP (`type: "detailed"`)
- Show "Yes, I'll attend" button that opens form
- Display form with configured fields
- Collect additional RSVP data before submission

### 2. Guest Response Status Handling

Templates receive guest status in multiple ways:

#### URL Parameters
```javascript
?hasResponded=true&accepted=true
```

#### PostMessage
```javascript
{
  hasResponded: boolean,  // Has guest already responded?
  accepted: boolean       // Did guest accept (if responded)?
}
```

### 3. Template Implementation Example

```javascript
// Template component logic
function RSVPSection({ rsvpConfig, hasResponded, accepted, guestName }) {
  const [showForm, setShowForm] = useState(false);
  
  // If guest already responded, show thank you message
  if (hasResponded) {
    return (
      <div className="rsvp-response">
        <h3>Thank you for your response!</h3>
        <p>You {accepted ? 'will be attending' : 'will not be attending'} this event.</p>
      </div>
    );
  }
  
  // Show RSVP interface based on configuration
  if (rsvpConfig.type === 'simple') {
    return (
      <div className="simple-rsvp">
        <button onClick={handleAcceptInvitation}>
          Accept Invitation
        </button>
        <button onClick={handleDeclineInvitation}>
          Decline
        </button>
      </div>
    );
  }
  
  // Detailed RSVP with form
  return (
    <div className="detailed-rsvp">
      {!showForm ? (
        <div>
          <button onClick={() => setShowForm(true)}>
            Yes, I'll attend
          </button>
          <button onClick={handleDeclineInvitation}>
            Decline
          </button>
        </div>
      ) : (
        <RSVPForm 
          fields={rsvpConfig.fields}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// Handle form submission
function handleFormSubmit(formData) {
  // Send RSVP with form data
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      accepted: true,
      rsvpData: formData  // Include form data
    }
  }, '*');
}

// Handle simple acceptance
function handleAcceptInvitation() {
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      accepted: true
      // No rsvpData for simple acceptance
    }
  }, '*');
}
```

### 4. Form Field Types

Templates must support these field types:

```typescript
interface RSVPField {
  name: string;           // Field identifier
  label: string;          // Display label
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;      // Is field required?
  options?: string[];     // For select type
  placeholder?: string;   // Placeholder text
}
```

### 5. URL Parameter Parsing

```javascript
// Parse RSVP config from URL
function parseRSVPConfig() {
  const urlParams = new URLSearchParams(window.location.search);
  const rsvpConfigParam = urlParams.get('rsvpConfig');
  
  if (rsvpConfigParam) {
    try {
      return JSON.parse(decodeURIComponent(rsvpConfigParam));
    } catch (error) {
      console.error('Failed to parse RSVP config:', error);
    }
  }
  
  // Default to simple RSVP
  return { type: 'simple' };
}

// Parse guest status
function parseGuestStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    hasResponded: urlParams.get('hasResponded') === 'true',
    accepted: urlParams.get('accepted') === 'true'
  };
}
```

### 6. PostMessage Response Format

When guest submits RSVP, send this format:

```javascript
// For detailed RSVP with form data
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: {
    accepted: true,
    rsvpData: {
      attendees: 2,
      dietary_requirements: 'Vegetarian',
      special_requests: 'Wheelchair access needed',
      // ... other form fields
    }
  },
  timestamp: Date.now(),
  source: 'TEMPLATE'
}, '*');

// For simple RSVP (no form)
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: {
    accepted: true
    // No rsvpData property
  },
  timestamp: Date.now(),
  source: 'TEMPLATE'
}, '*');

// For decline (both simple and detailed)
window.parent.postMessage({
  type: 'RSVP_DECLINED',
  data: {
    accepted: false
  },
  timestamp: Date.now(),
  source: 'TEMPLATE'
}, '*');
```

## Critical Implementation Points

1. **Always check `hasResponded`** - Don't show RSVP interface if guest already responded
2. **Respect RSVP type** - Show button vs form based on `rsvpConfig.type`
3. **Include form data** - For detailed RSVP, include `rsvpData` in response
4. **Handle fallbacks** - Default to simple RSVP if no config provided
5. **Validate forms** - Check required fields before submission

## Testing Scenarios

1. **Simple RSVP, New Guest**: Show accept/decline buttons
2. **Detailed RSVP, New Guest**: Show "Yes, I'll attend" button → form
3. **Already Responded Guest**: Show thank you message
4. **No RSVP Config**: Default to simple RSVP
5. **Invalid Config**: Handle gracefully with fallback

This implementation ensures templates can dynamically adapt their RSVP interface based on event host preferences while maintaining a consistent user experience.
