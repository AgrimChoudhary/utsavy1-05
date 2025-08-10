# Template Integration Guide for Utsavy Platform

## Overview
This guide explains how to properly integrate wedding invitation templates with the Utsavy platform using URL parameters and postMessage API communication.

## 1. URL Parameter Structure

### Base URL Format
```
https://your-template-domain.vercel.app/?eventId={EVENT_ID}&guestId={GUEST_ID}
```

### Required Parameters
- `eventId`: The unique event identifier (e.g., "Q5Y47")
- `guestId`: The unique guest identifier (e.g., "36G")

### Example URL
```
https://utsavytemplate1.vercel.app/?eventId=Q5Y47&guestId=36G
```

## 2. Data Structure Overview

The platform sends event data through postMessage API in the following structure:

```typescript
interface EventData {
  // Basic Event Info
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  
  // Couple Information
  brideName: string;
  groomName: string;
  couplePhoto?: string;
  
  // Family Information
  brideFamily: FamilyDetails;
  groomFamily: FamilyDetails;
  
  // Event Details
  events: EventDetail[];
  
  // Gallery
  gallery: string[];
  
  // RSVP Configuration
  rsvpConfig?: RSVPConfig;
  
  // Additional Data
  [key: string]: any;
}

interface FamilyDetails {
  side: "bride" | "groom";
  title: string;
  description: string;
  members: FamilyMember[];
  address?: string;
}

interface FamilyMember {
  name: string;
  relation: string;
  photo?: string;
  description?: string;
}

interface EventDetail {
  name: string;
  date: string;
  time: string;
  venue: string;
  description?: string;
}
```

## 3. PostMessage API Integration

### 3.1 Trusted Origins Setup

The platform only accepts messages from trusted domains. Ensure your template domain is added to the trusted origins list:

```typescript
const TRUSTED_ORIGINS = [
  'https://utsavy2.vercel.app',           // Main platform
  'https://utsavytemplate1.vercel.app',   // Your template domain
  // Add other template domains as needed
];
```

### 3.2 Receiving Data in Your Template

```typescript
// Listen for messages from the parent platform
window.addEventListener('message', (event) => {
  // Verify origin for security
  const trustedOrigins = [
    'https://utsavy2.vercel.app',
    'https://utsavytemplate1.vercel.app'
  ];
  
  if (!trustedOrigins.includes(event.origin)) {
    console.warn('Untrusted origin:', event.origin);
    return;
  }
  
  // Handle different message types
  switch (event.data.type) {
    case 'EVENT_DATA':
      handleEventData(event.data.payload);
      break;
    case 'GUEST_DATA':
      handleGuestData(event.data.payload);
      break;
    case 'FAMILY_DATA':
      handleFamilyData(event.data.payload);
      break;
    case 'URL_PARAMS':
      handleUrlParams(event.data.payload);
      break;
    default:
      console.log('Unknown message type:', event.data.type);
  }
});

// Function to handle event data
function handleEventData(eventData) {
  console.log('Received event data:', eventData);
  
  // Update your template with the received data
  updateInvitationContent(eventData);
}

// Function to handle family data specifically
function handleFamilyData(familyData) {
  console.log('Received family data:', familyData);
  
  // Process bride family
  if (familyData.brideFamily) {
    updateBrideFamilySection(familyData.brideFamily);
  }
  
  // Process groom family
  if (familyData.groomFamily) {
    updateGroomFamilySection(familyData.groomFamily);
  }
}
```

### 3.3 Requesting Data from Platform

```typescript
// Request specific data from the platform
function requestEventData() {
  const message = {
    type: 'REQUEST_EVENT_DATA',
    payload: {
      eventId: getUrlParameter('eventId'),
      guestId: getUrlParameter('guestId')
    }
  };
  
  // Send to parent window
  window.parent.postMessage(message, 'https://utsavy2.vercel.app');
}

// Request family data specifically
function requestFamilyData() {
  const message = {
    type: 'REQUEST_FAMILY_DATA',
    payload: {
      eventId: getUrlParameter('eventId')
    }
  };
  
  window.parent.postMessage(message, 'https://utsavy2.vercel.app');
}
```

## 4. URL Parameter Handling

### 4.1 Extract URL Parameters

```typescript
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Get event and guest IDs
const eventId = getUrlParameter('eventId');
const guestId = getUrlParameter('guestId');

console.log('Event ID:', eventId);
console.log('Guest ID:', guestId);
```

### 4.2 Validate Parameters

```typescript
function validateUrlParameters() {
  const eventId = getUrlParameter('eventId');
  const guestId = getUrlParameter('guestId');
  
  if (!eventId) {
    console.error('Missing eventId parameter');
    showError('Invalid invitation link: Missing event ID');
    return false;
  }
  
  if (!guestId) {
    console.error('Missing guestId parameter');
    showError('Invalid invitation link: Missing guest ID');
    return false;
  }
  
  // Validate format (adjust regex as needed)
  const eventIdPattern = /^[A-Z0-9]{5}$/;
  const guestIdPattern = /^[A-Z0-9]{3}$/;
  
  if (!eventIdPattern.test(eventId)) {
    console.error('Invalid eventId format:', eventId);
    return false;
  }
  
  if (!guestIdPattern.test(guestId)) {
    console.error('Invalid guestId format:', guestId);
    return false;
  }
  
  return true;
}
```

## 5. Family Section Implementation

### 5.1 Family Data Structure

```typescript
interface FamilyData {
  brideFamily: {
    side: "bride";
    title: string;
    description: string;
    members: FamilyMember[];
    address?: string;
  };
  groomFamily: {
    side: "groom";
    title: string;
    description: string;
    members: FamilyMember[];
    address?: string;
  };
}
```

### 5.2 Handle Family Data

```typescript
function updateBrideFamilySection(brideFamily) {
  const brideFamilyContainer = document.getElementById('bride-family');
  
  if (!brideFamilyContainer) {
    console.error('Bride family container not found');
    return;
  }
  
  // Update family title and description
  const titleElement = brideFamilyContainer.querySelector('.family-title');
  const descElement = brideFamilyContainer.querySelector('.family-description');
  
  if (titleElement) titleElement.textContent = brideFamily.title;
  if (descElement) descElement.textContent = brideFamily.description;
  
  // Update family members
  const membersContainer = brideFamilyContainer.querySelector('.family-members');
  if (membersContainer && brideFamily.members) {
    membersContainer.innerHTML = '';
    
    brideFamily.members.forEach(member => {
      const memberElement = createFamilyMemberElement(member);
      membersContainer.appendChild(memberElement);
    });
  }
}

function createFamilyMemberElement(member) {
  const memberDiv = document.createElement('div');
  memberDiv.className = 'family-member';
  
  memberDiv.innerHTML = `
    <div class="member-photo">
      ${member.photo ? `<img src="${member.photo}" alt="${member.name}" />` : ''}
    </div>
    <div class="member-info">
      <h4 class="member-name">${member.name}</h4>
      <p class="member-relation">${member.relation}</p>
      ${member.description ? `<p class="member-description">${member.description}</p>` : ''}
    </div>
  `;
  
  return memberDiv;
}
```

## 6. Error Handling and Debugging

### 6.1 Common Issues and Solutions

#### Issue 1: Family Parameter Errors
```typescript
// Add validation for family data
function validateFamilyData(familyData) {
  if (!familyData) {
    console.error('No family data received');
    return false;
  }
  
  // Check bride family
  if (familyData.brideFamily && !Array.isArray(familyData.brideFamily.members)) {
    console.error('Invalid bride family members data');
    return false;
  }
  
  // Check groom family
  if (familyData.groomFamily && !Array.isArray(familyData.groomFamily.members)) {
    console.error('Invalid groom family members data');
    return false;
  }
  
  return true;
}
```

#### Issue 2: Missing URL Parameters
```typescript
function handleMissingParameters() {
  const eventId = getUrlParameter('eventId');
  const guestId = getUrlParameter('guestId');
  
  if (!eventId || !guestId) {
    // Show error message to user
    showErrorMessage('Invalid invitation link. Please check your invitation URL.');
    
    // Try to request data from parent
    requestParametersFromParent();
    
    return false;
  }
  
  return true;
}

function requestParametersFromParent() {
  const message = {
    type: 'REQUEST_URL_PARAMS',
    payload: {}
  };
  
  window.parent.postMessage(message, '*');
}
```

### 6.2 Debug Logging

```typescript
// Enable debug mode
const DEBUG_MODE = true;

function debugLog(message, data = null) {
  if (DEBUG_MODE) {
    console.log(`[Template Debug] ${message}`, data || '');
  }
}

// Use throughout your code
debugLog('URL Parameters extracted', { eventId, guestId });
debugLog('Received family data', familyData);
debugLog('PostMessage received', event.data);
```

## 7. Complete Template Integration Example

```typescript
class TemplateIntegration {
  constructor() {
    this.eventId = null;
    this.guestId = null;
    this.eventData = null;
    this.isDataLoaded = false;
    
    this.init();
  }
  
  init() {
    // Extract URL parameters
    this.extractUrlParameters();
    
    // Validate parameters
    if (!this.validateParameters()) {
      this.handleInvalidParameters();
      return;
    }
    
    // Set up message listener
    this.setupMessageListener();
    
    // Request initial data
    this.requestInitialData();
    
    // Set up loading state
    this.showLoadingState();
  }
  
  extractUrlParameters() {
    this.eventId = this.getUrlParameter('eventId');
    this.guestId = this.getUrlParameter('guestId');
    
    console.log('Parameters extracted:', {
      eventId: this.eventId,
      guestId: this.guestId
    });
  }
  
  validateParameters() {
    if (!this.eventId || !this.guestId) {
      console.error('Missing required parameters');
      return false;
    }
    
    return true;
  }
  
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Verify origin
      const trustedOrigins = [
        'https://utsavy2.vercel.app',
        'https://utsavytemplate1.vercel.app'
      ];
      
      if (!trustedOrigins.includes(event.origin)) {
        return;
      }
      
      this.handleMessage(event.data);
    });
  }
  
  handleMessage(messageData) {
    switch (messageData.type) {
      case 'EVENT_DATA':
        this.handleEventData(messageData.payload);
        break;
      case 'FAMILY_DATA':
        this.handleFamilyData(messageData.payload);
        break;
      case 'URL_PARAMS':
        this.handleUrlParams(messageData.payload);
        break;
      default:
        console.log('Unknown message type:', messageData.type);
    }
  }
  
  requestInitialData() {
    // Request all needed data
    this.sendMessage('REQUEST_EVENT_DATA', {
      eventId: this.eventId,
      guestId: this.guestId
    });
  }
  
  sendMessage(type, payload) {
    const message = { type, payload };
    window.parent.postMessage(message, 'https://utsavy2.vercel.app');
  }
  
  handleEventData(eventData) {
    this.eventData = eventData;
    this.updateInvitation(eventData);
    this.hideLoadingState();
    this.isDataLoaded = true;
  }
  
  handleFamilyData(familyData) {
    if (familyData.brideFamily) {
      this.updateBrideFamilySection(familyData.brideFamily);
    }
    
    if (familyData.groomFamily) {
      this.updateGroomFamilySection(familyData.groomFamily);
    }
  }
  
  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
  
  showLoadingState() {
    document.body.classList.add('loading');
  }
  
  hideLoadingState() {
    document.body.classList.remove('loading');
  }
  
  handleInvalidParameters() {
    this.showErrorMessage('Invalid invitation link. Please check your URL.');
  }
  
  showErrorMessage(message) {
    console.error(message);
    // Implement your error UI here
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TemplateIntegration();
});
```

## 8. Testing Checklist

### Before Deployment:
- [ ] URL parameters are correctly extracted
- [ ] Family data displays correctly
- [ ] PostMessage communication works
- [ ] Error handling works for missing parameters
- [ ] Loading states are implemented
- [ ] All family members display properly
- [ ] Images load correctly
- [ ] RSVP functionality works (if implemented)

### Test URLs:
```
// Valid invitation
https://your-template.vercel.app/?eventId=Q5Y47&guestId=36G

// Missing eventId (should show error)
https://your-template.vercel.app/?guestId=36G

// Missing guestId (should show error)
https://your-template.vercel.app/?eventId=Q5Y47

// Invalid format (should show error)
https://your-template.vercel.app/?eventId=invalid&guestId=123
```

## 9. Best Practices

1. **Always validate URL parameters** before using them
2. **Verify postMessage origin** for security
3. **Handle loading states** gracefully
4. **Implement error handling** for all scenarios
5. **Use debug logging** during development
6. **Test with various data scenarios** (missing family members, etc.)
7. **Optimize for mobile devices**
8. **Handle network timeouts** gracefully

## 10. Support and Troubleshooting

If you encounter issues:

1. Check browser console for error messages
2. Verify URL parameters are correct
3. Ensure your domain is in the trusted origins list
4. Test postMessage communication
5. Validate family data structure

Contact the platform team with:
- Error messages from console
- Sample URL that's not working
- Description of expected vs actual behavior

---

## Contact Information
For technical support or questions about this integration guide, please contact the Utsavy platform development team.