# RSVP Integration Guide for Template Teams

## Issue Analysis

From the network requests and code analysis, the issue you're experiencing is **NOT** a platform problem. The RSVP configuration is working correctly on the platform side. Here's what's happening:

### Current Event Status
- **Event ID**: `68a7834c-fd88-49a3-a06a-8755c53825ac`  
- **Current RSVP Config**: `{"type": "simple"}` (correctly updated in database)
- **Template**: Royal Indian Wedding (external template)

### Problem Source
The template is **NOT** reading the updated RSVP configuration properly. The network requests show that the platform is correctly sending the updated `rsvp_config` with `"type": "simple"`, but your template is still displaying the old behavior.

## How RSVP Configuration Works

### 1. Platform Side (Working Correctly)
```json
// Event object structure sent to template
{
  "id": "68a7834c-fd88-49a3-a06a-8755c53825ac",
  "rsvp_config": {
    "type": "simple"  // or "detailed"
  },
  // ... other event data
}
```

### 2. Data Transfer Methods

#### For Royal Indian Wedding Template
**Form Data**: Sent via URL parameters (for faster loading)
**RSVP Config**: Sent via both URL parameters AND postMessage API

#### URL Parameter Format
```
https://utsavytemplate1.vercel.app/invitation?
  eventId=68a7834c-fd88-49a3-a06a-8755c53825ac&
  guestId=YOUR_GUEST_ID&
  rsvpConfig={"type":"simple"}&
  eventData={...form data...}
```

#### PostMessage API Format
```javascript
// Platform sends this message to iframe
window.parent.postMessage({
  type: 'LOAD_INVITATION_DATA',
  data: {
    event: {
      rsvp_config: { type: "simple" },
      // ... other event data
    },
    guest: { /* guest data */ }
  }
}, 'https://utsavytemplate1.vercel.app');
```

## Template Implementation Requirements

### 1. Read RSVP Config from Multiple Sources

```javascript
// Method 1: From URL parameters
const urlParams = new URLSearchParams(window.location.search);
const rsvpConfigParam = urlParams.get('rsvpConfig');
let rsvpConfig = null;

if (rsvpConfigParam) {
  try {
    rsvpConfig = JSON.parse(rsvpConfigParam);
  } catch (e) {
    console.error('Failed to parse rsvpConfig from URL:', e);
  }
}

// Method 2: From postMessage API
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://56d76d10-3326-4860-9418-d8552aeee4c9.lovableproject.com') {
    return;
  }
  
  if (event.data.type === 'LOAD_INVITATION_DATA') {
    const eventData = event.data.data.event;
    rsvpConfig = eventData.rsvp_config || rsvpConfig;
    
    // Update your UI based on rsvpConfig
    updateRSVPUI(rsvpConfig);
  }
});
```

### 2. RSVP UI Logic

```javascript
function updateRSVPUI(rsvpConfig) {
  const rsvpType = rsvpConfig?.type || 'simple';
  
  if (rsvpType === 'detailed') {
    // Show detailed RSVP form with additional fields
    showDetailedRSVPForm();
  } else {
    // Show simple RSVP buttons (Accept/Decline only)
    showSimpleRSVPForm();
  }
}

function showSimpleRSVPForm() {
  // Display simple Accept/Decline buttons
  // When clicked, send postMessage back to platform
}

function showDetailedRSVPForm() {
  // Display detailed form with:
  // - Accept/Decline buttons
  // - Number of attendees field
  // - Dietary preferences
  // - Special requirements
  // - Any additional fields you want
}
```

### 3. RSVP Response Format

```javascript
// For simple RSVP
function acceptInvitation() {
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      guestId: guestId,
      // No additional data for simple RSVP
    }
  }, '*');
}

// For detailed RSVP
function submitDetailedRSVP(formData) {
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      guestId: guestId,
      rsvpData: {
        attendees: formData.attendees,
        dietaryPreferences: formData.dietary,
        specialRequirements: formData.special,
        // Add any other fields
      }
    }
  }, '*');
}

function declineInvitation() {
  window.parent.postMessage({
    type: 'RSVP_DECLINED',
    data: {
      guestId: guestId
    }
  }, '*');
}
```

## Debugging Steps for Template Team

### 1. Check Data Reception
```javascript
// Add this to your template to debug
console.log('URL Parameters:', window.location.search);
console.log('RSVP Config from URL:', urlParams.get('rsvpConfig'));

window.addEventListener('message', (event) => {
  console.log('Received message:', event.data);
  if (event.data.type === 'LOAD_INVITATION_DATA') {
    console.log('Event RSVP Config:', event.data.data.event.rsvp_config);
  }
});
```

### 2. Verify Current Implementation
- Check if your template is properly parsing the `rsvpConfig` URL parameter
- Verify that your postMessage listener is correctly handling the RSVP config
- Ensure your UI updates when the RSVP config changes

### 3. Test the Integration
1. Change RSVP type in platform dashboard
2. Open guest invitation link
3. Check browser console for debug logs
4. Verify correct UI is displayed

## Expected Behavior

### Simple RSVP (`type: "simple"`)
- Show only "Accept" and "Decline" buttons
- No additional form fields
- Direct acceptance/decline without extra data collection

### Detailed RSVP (`type: "detailed"`)
- Show "Accept" and "Decline" buttons
- If "Accept" clicked, show detailed form with additional fields
- Collect additional data before final submission

## Common Issues and Solutions

### Issue: Template shows old RSVP type
**Solution**: Template is not properly reading updated config. Check URL parameter parsing and postMessage handling.

### Issue: RSVP data not saving correctly
**Solution**: Verify the postMessage format matches the expected structure above.

### Issue: UI not updating after config change
**Solution**: Ensure your template re-renders the RSVP section when new data is received.

## Platform URLs for Testing

- **Event Management**: `/event/68a7834c-fd88-49a3-a06a-8755c53825ac`
- **Guest Invitation**: Generated automatically with proper parameters
- **Template URL**: `https://utsavytemplate1.vercel.app`

## Contact

If you implement these changes and still experience issues, please provide:
1. Browser console logs from the template
2. Network tab showing the actual URL parameters
3. Screenshots of the incorrect behavior

The platform side is working correctly - the issue is in the template's data handling.
