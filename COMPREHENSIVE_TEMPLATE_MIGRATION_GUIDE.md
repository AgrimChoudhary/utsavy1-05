# Comprehensive Template Migration Guide
## RSVP System V2 + Security & Scalability Updates

This guide covers all requirements for external templates to work with the RSVP Platform, including the new V2 status system and critical security enhancements.

---

## 🚨 Critical Security Requirements

### Guest ID Collision Prevention

**Problem**: Guest IDs are only 3 characters long (46,656 combinations per event). At scale, multiple events will have duplicate guest IDs, causing cross-event contamination.

**Solution**: All RSVP postMessage communications MUST include both `eventId` and `guestId`.

#### ✅ Required postMessage Format
```javascript
// Accept RSVP
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: {
    guestId: 'ABC',      // Required: Guest identifier
    eventId: 'XYZ12',    // Required: Event identifier  
    accepted: true,
    rsvpData: { /* custom fields */ }
  }
}, '*');

// Decline RSVP
window.parent.postMessage({
  type: 'RSVP_DECLINED', 
  data: {
    guestId: 'ABC',      // Required
    eventId: 'XYZ12'     // Required
  }
}, '*');

// Mark as viewed
window.parent.postMessage({
  type: 'INVITATION_VIEWED',
  data: {
    guestId: 'ABC',      // Required
    eventId: 'XYZ12'     // Required
  }
}, '*');
```

#### ❌ Insecure Format (Will Be Rejected)
```javascript
// Missing event context - VULNERABLE
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: {
    guestId: 'ABC'  // No eventId - causes collisions!
  }
}, '*');
```

---

## 📊 RSVP Status System V2

### Status Flow: 4-Stage System
```
pending → viewed → accepted → submitted
   ↓        ↓         ↓          ↓
Initial  Opened   Confirmed   Final
```

### Status Meanings
- **`pending`**: Guest hasn't opened invitation yet
- **`viewed`**: Guest opened invitation but hasn't responded
- **`accepted`**: Guest accepted but hasn't submitted final RSVP
- **`submitted`**: Guest completed entire RSVP process

---

## 🔧 Implementation Guide

### Step 1: Parse Initial Data
```javascript
let currentGuestId, currentEventId, guestStatus;

window.addEventListener('message', (event) => {
  if (event.data.type === 'INVITATION_LOADED') {
    const payload = event.data.payload;
    
    // Store for future postMessage calls
    currentGuestId = payload.guestId;
    currentEventId = payload.eventId;
    guestStatus = payload.guestStatus;
    
    // V2 Status fields
    const canSubmitRSVP = payload.canSubmitRSVP;
    const canEditRSVP = payload.canEditRSVP;
    const rsvpClosed = payload.rsvpClosed;
    const deadlineMessage = payload.deadlineMessage;
    
    console.log('Invitation loaded:', {
      guestId: currentGuestId,
      eventId: currentEventId,
      status: guestStatus,
      canSubmit: canSubmitRSVP,
      canEdit: canEditRSVP,
      closed: rsvpClosed
    });
  }
});
```

### Step 2: Implement Status-Based UI
```javascript
function RSVPSection({ guestStatus, canSubmitRSVP, canEditRSVP, rsvpClosed }) {
  if (rsvpClosed) {
    return <div className="text-gray-500">RSVP deadline has passed</div>;
  }

  switch (guestStatus) {
    case 'pending':
      return (
        <button onClick={markAsViewed}>
          View Invitation
        </button>
      );
      
    case 'viewed':
      return (
        <div>
          <button onClick={acceptInvitation}>Accept</button>
          <button onClick={declineInvitation}>Decline</button>
        </div>
      );
      
    case 'accepted':
      if (canSubmitRSVP) {
        return (
          <button onClick={submitFinalRSVP}>
            Complete RSVP
          </button>
        );
      }
      return <div>Waiting for RSVP form...</div>;
      
    case 'submitted':
      if (canEditRSVP) {
        return (
          <button onClick={editRSVP}>
            Edit RSVP
          </button>
        );
      }
      return <div>RSVP Submitted Successfully!</div>;
      
    default:
      return <div>Loading...</div>;
  }
}
```

### Step 3: Implement RSVP Actions
```javascript
function markAsViewed() {
  window.parent.postMessage({
    type: 'INVITATION_VIEWED',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId
    }
  }, '*');
}

function acceptInvitation() {
  window.parent.postMessage({
    type: 'RSVP_ACCEPTED',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId,
      accepted: true
    }
  }, '*');
}

function declineInvitation() {
  window.parent.postMessage({
    type: 'RSVP_DECLINED',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId
    }
  }, '*');
}

function submitFinalRSVP(rsvpData) {
  window.parent.postMessage({
    type: 'RSVP_UPDATED',
    data: {
      guestId: currentGuestId,
      eventId: currentEventId,
      rsvpData: rsvpData,
      newStatus: 'submitted'
    }
  }, '*');
}
```

### Step 4: Handle Real-time Updates
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'STATUS_UPDATE') {
    const { newStatus, canSubmitRSVP, canEditRSVP } = event.data;
    
    // Update UI based on new status
    guestStatus = newStatus;
    updateUIState({
      status: newStatus,
      canSubmit: canSubmitRSVP,
      canEdit: canEditRSVP
    });
  }
});
```

---

## 🎨 Enhanced UI Components

### Status Badge Component
```javascript
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Not Viewed', color: 'gray' },
    viewed: { label: 'Viewed', color: 'blue' },
    accepted: { label: 'Accepted', color: 'green' },
    submitted: { label: 'Completed', color: 'emerald' }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={`badge badge-${config.color}`}>
      {config.label}
    </span>
  );
}
```

### Progress Indicator
```javascript
function RSVPProgress({ currentStatus }) {
  const steps = ['pending', 'viewed', 'accepted', 'submitted'];
  const currentIndex = steps.indexOf(currentStatus);
  
  return (
    <div className="progress-bar">
      {steps.map((step, index) => (
        <div 
          key={step}
          className={`step ${index <= currentIndex ? 'completed' : ''}`}
        >
          {step}
        </div>
      ))}
    </div>
  );
}
```

### Deadline Display
```javascript
function DeadlineDisplay({ rsvpClosed, deadlineMessage }) {
  if (rsvpClosed && deadlineMessage) {
    return (
      <div className="deadline-warning">
        ⚠️ {deadlineMessage}
      </div>
    );
  }
  return null;
}
```

---

## 🔄 Migration Timeline

### Phase 1: Current (Backward Compatibility)
- ✅ Platform accepts messages with or without event context
- ✅ Platform validates IDs when provided
- ✅ Templates can gradually adopt new format

### Phase 2: Future (Enforcement)
- ⏳ Platform will require both `guestId` and `eventId`
- ⏳ Messages without event context will be rejected
- ⏳ All templates must be updated

---

## 🧪 Testing Scenarios

### Security Testing
```javascript
// Test 1: Same Guest ID Across Events
// Event A: Guest ID "ABC"
// Event B: Guest ID "ABC"
// Verify: Each responds only to their own event

// Test 2: Malicious Template
// Send: { guestId: 'XYZ', eventId: 'WRONG' }
// Expected: Platform rejects message

// Test 3: Legacy Support
// Send: { guestId: 'ABC' } // No eventId
// Expected: Platform processes but logs warning
```

### Status Flow Testing
```javascript
// Test status progression
pending → markAsViewed() → viewed
viewed → acceptInvitation() → accepted  
accepted → submitFinalRSVP() → submitted
submitted → editRSVP() → accepted
```

---

## 📋 Implementation Checklist

### Required Updates
- [ ] **Parse `eventId` and `guestId` from `INVITATION_LOADED`**
- [ ] **Include both IDs in ALL postMessage calls**
- [ ] **Implement 4-stage status system UI**
- [ ] **Handle `canSubmitRSVP` and `canEditRSVP` flags**
- [ ] **Display deadline messages when `rsvpClosed`**
- [ ] **Listen for `STATUS_UPDATE` events**

### Security Validation
- [ ] **Verify postMessage includes both `eventId` and `guestId`**
- [ ] **Test with multiple events having same guest IDs**
- [ ] **Confirm no cross-event contamination**

### Enhanced Features
- [ ] **Add status badge component**
- [ ] **Implement progress indicator**
- [ ] **Handle real-time status updates**
- [ ] **Display appropriate buttons based on status**

---

## 🔍 Common Pitfalls

### ❌ Don't Do This
```javascript
// Missing event context
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: { guestId: 'ABC' }  // Vulnerable!
}, '*');

// Wrong status handling
if (guestStatus === 'accepted') {
  showSubmitButton(); // Wrong - check canSubmitRSVP flag
}
```

### ✅ Do This Instead
```javascript
// Include event context
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: { 
    guestId: currentGuestId,
    eventId: currentEventId 
  }
}, '*');

// Proper status handling
if (guestStatus === 'accepted' && canSubmitRSVP) {
  showSubmitButton(); // Correct - use both conditions
}
```

---

## 📞 Support

For questions about this migration:
1. Check console logs for validation warnings
2. Test with multiple events to verify security
3. Ensure all postMessage calls include both IDs
4. Verify status flow works correctly

**This security enhancement is critical for platform scalability and must be implemented by all template teams.**