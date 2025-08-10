# Royal Wedding Template - Platform Integration Guide
## Enhanced RSVP System Migration

### Document Version: 2.0
### Date: July 2025
### Status: Required Implementation

---

## 1. Executive Summary

The platform has evolved from basic accept functionality to a comprehensive RSVP management system supporting both simple and detailed response collection. The Royal Wedding template must be updated to seamlessly integrate with these new capabilities.

### Key Changes Required:
- Migration from basic accept button to dynamic RSVP interface
- Support for detailed custom fields and editing functionality
- Enhanced data collection and validation
- Improved guest experience with form-based responses
- Remove decline button functionality (accept-only flow)

---

## 2. Current State Analysis

### 2.1 Existing Implementation
Your template currently implements:
```javascript
// Current basic implementation
<button onClick={handleAcceptInvitation} className="accept-button">
  Accept Invitation
</button>

// Basic PostMessage response
window.parent.postMessage({
  type: 'RSVP_ACCEPTED',
  data: { accepted: true }
}, '*');
```

### 2.2 Platform Communication Methods
Currently using:
- URL parameters for event data transmission
- Basic PostMessage for accept responses
- Limited to boolean acceptance status

---

## 3. New Platform Requirements

### 3.1 RSVP Configuration Types

#### Simple RSVP (`type: "simple"`)
- Single "Accept Invitation" button interface
- Direct acceptance without additional data collection
- Maintains current user experience for basic events

#### Detailed RSVP (`type: "detailed"`)
- Two-step process: Accept → Custom Form
- Configurable custom fields with edit functionality
- Rich data collection capabilities
- Enhanced guest experience with ability to modify responses


### 3.3 Dynamic Field Configuration
Custom fields support various input types:
- `text` - Single line text input
- `textarea` - Multi-line text input
- `select` - Dropdown with predefined options
- `number` - Numeric input with validation
- `email` - Email address with validation
- `phone` - Phone number input
- `date` - Date picker
- `time` - Time picker
- `datetime` - Combined date and time picker
- `checkbox` - Boolean toggle
- `radio` - Single selection from options

---

## 4. Platform Data Flow Architecture

### 4.1 Initialization Flow
```
Platform → Template: Send invitation URL with parameters
Template → Template: Parse URL parameters
Template → Platform: Send INVITATION_LOADED message
Platform → Template: Send complete event data via PostMessage
Template → Guest: Render invitation interface
```

### 4.2 RSVP Submission Flow
```
Guest → Template: Clicks "Accept Invitation"

Simple RSVP:
Template → Platform: Send RSVP_ACCEPTED (basic)
Platform → Database: Store acceptance status

Detailed RSVP:
Template → Guest: Show custom fields form
Guest → Template: Submit form data
Template → Platform: Send RSVP_ACCEPTED (with rsvpData)
Platform → Database: Store acceptance + custom data

Platform → Template: Send confirmation response
Template → Guest: Show thank you message
```

### 4.3 Data Transmission Methods

#### URL Parameters (Primary)
```javascript
// Enhanced URL structure
const invitationUrl = `${templateBaseUrl}?` +
  `eventId=${eventId}&` +
  `guestId=${guestId}&` +
  `guestName=${encodeURIComponent(guestName)}&` +
  `hasResponded=${hasResponded}&` +
  `accepted=${accepted}&` +
  `rsvpConfig=${encodeURIComponent(JSON.stringify(rsvpConfig))}&` +
  `eventData=${encodeURIComponent(JSON.stringify(eventDetails))}`;
```

#### PostMessage Communication (Secondary)
```javascript
// Platform → Template: Enhanced event data
{
  type: 'INVITATION_LOADED_RESPONSE',
  data: {
    eventId: 'ABC123',
    guestId: 'XYZ789',
    guestName: 'John Doe',
    hasResponded: false,
    accepted: false,
    rsvpConfig: {
      type: 'detailed',
      hasCustomFields: true,
      allowEditAfterSubmit: true,
      fields: [
        {
          id: 'guest_count',
          field_name: 'guest_count',
          field_label: 'Number of Guests',
          field_type: 'select',
          is_required: true,
          field_options: { options: ['1', '2', '3', '4', '5', '6', '7', '8', '9+'] },
          placeholder_text: 'Select number of guests'
        },
        {
          id: 'dietary_restrictions',
          field_name: 'dietary_restrictions',
          field_label: 'Dietary Restrictions',
          field_type: 'textarea',
          is_required: false,
          placeholder_text: 'Please mention any dietary restrictions or allergies'
        }
      ]
    },
    eventData: { /* complete event details */ }
  }
}

// Template → Platform: Enhanced RSVP response
{
  type: 'RSVP_ACCEPTED',
  data: {
    accepted: true,
    rsvpData: {
      guest_count: '2',
      dietary_restrictions: 'Vegetarian, No nuts',
      arrival_time: '2025-08-15T18:30:00Z',
      additional_details: 'Looking forward to the celebration!'
    }
  },
  timestamp: Date.now(),
  source: 'ROYAL_WEDDING_TEMPLATE'
}
```

---

## 5. Implementation Requirements

### 5.1 Core Component Structure
```typescript
// Required interface definitions
interface RSVPConfig {
  type: 'simple' | 'detailed';
  hasCustomFields?: boolean;
  allowEditAfterSubmit?: boolean;
  fields?: RSVPField[];
}

interface RSVPField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'phone' | 'date' | 'time' | 'datetime' | 'checkbox' | 'radio';
  is_required: boolean;
  field_options?: any;
  placeholder_text?: string;
  validation_rules?: any;
  display_order?: number;
}

interface TemplateProps {
  eventDetails: any;
  guestName: string;
  onAccept: (rsvpData?: any) => void;
  hasResponded: boolean;
  accepted: boolean;
  rsvpConfig?: RSVPConfig;
}
```

### 5.2 Updated RSVP Component Implementation
```typescript
// Enhanced RSVP component for Royal Wedding template
import React, { useState, useEffect } from 'react';
import { RSVPConfig, RSVPField } from './types';

interface RSVPSectionProps {
  rsvpConfig: RSVPConfig;
  hasResponded: boolean;
  accepted: boolean;
  guestName: string;
  onAccept: (rsvpData?: any) => void;
  
}

export const EnhancedRSVPSection: React.FC<RSVPSectionProps> = ({
  rsvpConfig,
  hasResponded,
  accepted,
  guestName,
  onAccept
}) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Guest has already responded
  if (hasResponded && accepted) {
    return (
      <div className="rsvp-response-container">
        <div className="thank-you-message">
          <h3>Thank you for accepting our invitation!</h3>
          <p>Dear {guestName}, we look forward to celebrating with you.</p>
          {rsvpConfig.allowEditAfterSubmit && (
            <button 
              onClick={() => setShowCustomForm(true)}
              className="edit-response-button"
            >
              Update Your Details
            </button>
          )}
        </div>
      </div>
    );
  }

  // Simple RSVP interface - single accept button
  if (rsvpConfig.type === 'simple') {
    return (
      <div className="simple-rsvp-container">
        <div className="rsvp-question">
          <h3>We would be honored by your presence at our celebration</h3>
        </div>
        <button 
          onClick={() => onAccept()}
          className="accept-button royal-accept-btn"
        >
          ✨ Accept Invitation ✨
        </button>
      </div>
    );
  }

  // Detailed RSVP interface - accept then form
  return (
    <div className="detailed-rsvp-container">
      {!showCustomForm ? (
        <div className="initial-response">
          <div className="rsvp-question">
            <h3>We would be honored by your presence at our celebration</h3>
          </div>
          <button 
            onClick={() => setShowCustomForm(true)}
            className="accept-button royal-accept-btn"
          >
            ✨ Accept Invitation ✨
          </button>
        </div>
      ) : (
        <RSVPCustomForm
          fields={rsvpConfig.fields || []}
          formData={formData}
          formErrors={formErrors}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowCustomForm(false)}
          guestName={guestName}
        />
      )}
    </div>
  );

  function handleFormSubmit(data: Record<string, any>) {
    // Validate and submit RSVP with custom data
    const errors = validateFormData(data, rsvpConfig.fields || []);
    if (Object.keys(errors).length === 0) {
      onAccept(data);
    } else {
      setFormErrors(errors);
    }
  }
};
```

### 5.3 Core Implementation Requirements

You must implement these essential components:

1. **RSVPCustomForm Component**: Renders form fields dynamically based on `rsvpConfig.fields`
2. **RSVPFieldRenderer Component**: Handles different field types (text, select, textarea, etc.)
3. **Form Validation**: Validates required fields and field-specific validation (email, phone)
4. **URL Parameter Parsing**: Extracts `rsvpConfig`, guest data, and event details from URL
5. **PostMessage Integration**: Communicates RSVP responses back to platform
6. **Edit Functionality**: When `allowEditAfterSubmit` is true, show "Update Your Details" button

---

## 6. Styling Integration

### 6.1 Royal Theme CSS Classes
```css
/* Enhanced RSVP styling for Royal Wedding template */
.detailed-rsvp-container {
  background: linear-gradient(135deg, #8B0000, #CD853F);
  border: 2px solid #FFD700;
  border-radius: 15px;
  padding: 2rem;
  margin: 2rem 0;
  color: #FFFFFF;
  font-family: 'Cormorant Garamond', serif;
}

.royal-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  color: #8B0000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.royal-accept-btn {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #8B0000;
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
}

.royal-accept-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.6);
}


.royal-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #DDD;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.royal-input:focus {
  outline: none;
  border-color: #FFD700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.royal-submit-btn {
  background: linear-gradient(135deg, #8B0000, #CD853F);
  color: #FFFFFF;
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.field-error {
  color: #DC3545;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  display: block;
}

.form-field {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #8B0000;
}

.required {
  color: #DC3545;
  margin-left: 0.25rem;
}
```

---

## 7. Platform Data Communication Details

### 7.1 How Platform Sends Data to Template

The platform communicates with your template through two primary methods:

#### Method 1: URL Parameters (Recommended)
```javascript
// Platform constructs invitation URL
const constructInvitationURL = (eventData, guestData, rsvpConfig) => {
  const baseUrl = 'https://utsavytemplate1.vercel.app/';
  const params = new URLSearchParams();
  
  // Basic guest information
  params.append('eventId', eventData.id);
  params.append('guestId', guestData.id);
  params.append('guestName', guestData.name);
  params.append('hasResponded', guestData.hasResponded.toString());
  params.append('accepted', guestData.accepted.toString());
  
  // RSVP configuration
  params.append('rsvpConfig', encodeURIComponent(JSON.stringify(rsvpConfig)));
  
  // Complete event details
  params.append('eventData', encodeURIComponent(JSON.stringify(eventData.details)));
  
  return `${baseUrl}?${params.toString()}`;
};
```

#### Method 2: PostMessage Communication
```javascript
// Platform sends enhanced data after template loads
window.addEventListener('message', (event) => {
  if (event.data.type === 'INVITATION_LOADED') {
    // Template has loaded, send complete data
    event.source.postMessage({
      type: 'INVITATION_LOADED_RESPONSE',
      data: {
        eventId: eventData.id,
        guestId: guestData.id,
        guestName: guestData.name,
        hasResponded: guestData.hasResponded,
        accepted: guestData.accepted,
        rsvpConfig: rsvpConfiguration,
        eventData: eventData.details,
        platformVersion: '2.0'
      }
    }, '*');
  }
});
```

### 7.2 How Platform Receives Data from Template

#### RSVP Response Handling
```javascript
// Platform listens for RSVP responses
window.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'RSVP_ACCEPTED':
      handleRSVPAcceptance(event.data.data);
      break;
    
    case 'RSVP_DECLINED':
      handleRSVPDecline(event.data.data);
      break;
  }
});

// Platform processes RSVP acceptance
const handleRSVPAcceptance = async (rsvpData) => {
  const { accepted, rsvpData: customFieldData } = rsvpData;
  
  // Update guest status in database
  await updateGuestStatus(guestId, {
    accepted: true,
    accepted_at: new Date().toISOString(),
    rsvp_data: customFieldData // Store custom field responses
  });
  
  // Send confirmation back to template
  templateWindow.postMessage({
    type: 'RSVP_UPDATE_RESPONSE',
    data: {
      success: true,
      message: 'RSVP submitted successfully',
      timestamp: Date.now()
    }
  }, '*');
};
```

### 7.3 Database Integration

#### RSVP Data Storage Structure
```sql
-- Enhanced guests table structure
UPDATE guests SET
  accepted = true,
  accepted_at = NOW(),
  rsvp_data = '{
    "guest_count": "2",
    "dietary_restrictions": "Vegetarian, No nuts",
    "arrival_time": "2025-08-15T18:30:00Z",
    "additional_details": "Looking forward to the celebration!"
  }'
WHERE id = guest_id;
```

#### Custom Fields Configuration Storage
```sql
-- RSVP field definitions table
SELECT 
  field_name,
  field_label,
  field_type,
  is_required,
  field_options,
  placeholder_text
FROM rsvp_field_definitions 
WHERE event_id = event_id
ORDER BY display_order;
```

---

## 8. Testing Requirements

### 8.1 Test Scenarios Matrix

| Test Case | RSVP Type | Guest Status | Expected Behavior |
|-----------|-----------|--------------|-------------------|
| New Guest Simple | Simple | Not responded | Show accept button |
| New Guest Detailed | Detailed | Not responded | Show accept button → custom form |
| Already Accepted | Both | Responded + Accepted | Show thank you message + edit option |
| Form Validation | Detailed | Not responded | Prevent submission with errors |
| Edit After Submit | Detailed | Responded + Accepted | Allow form reopening when enabled |
| No Config Fallback | None | Not responded | Default to simple RSVP |
| Invalid Config | Invalid JSON | Not responded | Graceful fallback to simple |

### 8.2 Integration Testing Code
```javascript
// Test suite for RSVP functionality
describe('Royal Wedding RSVP Integration', () => {
  test('Simple RSVP flow', async () => {
    const mockConfig = { type: 'simple' };
    const mockProps = {
      rsvpConfig: mockConfig,
      hasResponded: false,
      accepted: false,
      guestName: 'John Doe',
      onAccept: jest.fn(),
      onDecline: jest.fn()
    };
    
    render(<EnhancedRSVPSection {...mockProps} />);
    
    const acceptButton = screen.getByText("✨ Yes, I'll be there! ✨");
    fireEvent.click(acceptButton);
    
    expect(mockProps.onAccept).toHaveBeenCalledWith();
  });

  test('Detailed RSVP with custom fields', async () => {
    const mockConfig = {
      type: 'detailed',
      hasCustomFields: true,
      fields: [
        {
          id: 'guest_count',
          field_name: 'guest_count',
          field_label: 'Number of Guests',
          field_type: 'select',
          is_required: true,
          field_options: { options: ['1', '2', '3'] }
        }
      ]
    };
    
    const mockProps = {
      rsvpConfig: mockConfig,
      hasResponded: false,
      accepted: false,
      guestName: 'Jane Smith',
      onAccept: jest.fn(),
      onDecline: jest.fn()
    };
    
    render(<EnhancedRSVPSection {...mockProps} />);
    
    // Click accept to show form
    fireEvent.click(screen.getByText("✨ Yes, I'll be there! ✨"));
    
    // Fill form and submit
    const selectField = screen.getByDisplayValue('');
    fireEvent.change(selectField, { target: { value: '2' } });
    
    fireEvent.click(screen.getByText('Complete RSVP ✨'));
    
    expect(mockProps.onAccept).toHaveBeenCalledWith({ guest_count: '2' });
  });

  test('Form validation prevents submission', () => {
    const mockConfig = {
      type: 'detailed',
      fields: [
        {
          id: 'email',
          field_name: 'email',
          field_label: 'Email Address',
          field_type: 'email',
          is_required: true
        }
      ]
    };
    
    const mockProps = {
      rsvpConfig: mockConfig,
      hasResponded: false,
      accepted: false,
      guestName: 'Test User',
      onAccept: jest.fn(),
      onDecline: jest.fn()
    };
    
    render(<EnhancedRSVPSection {...mockProps} />);
    
    // Click accept to show form
    fireEvent.click(screen.getByText("✨ Yes, I'll be there! ✨"));
    
    // Try to submit without filling required field
    fireEvent.click(screen.getByText('Complete RSVP ✨'));
    
    // Should show validation error
    expect(screen.getByText('Email Address is required')).toBeInTheDocument();
    expect(mockProps.onAccept).not.toHaveBeenCalled();
  });
});
```

---

## 9. Performance & Optimization

### 9.1 Loading Performance
```javascript
// Lazy load form components to reduce initial bundle size
import { lazy, Suspense } from 'react';

const RSVPCustomForm = lazy(() => import('./RSVPCustomForm'));

// Use Suspense for loading states
<Suspense fallback={<div className="form-loading">Loading form...</div>}>
  <RSVPCustomForm {...formProps} />
</Suspense>
```

### 9.2 Real-time Validation Optimization
```javascript
// Debounced validation for better performance
import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

const debouncedValidation = useMemo(
  () => debounce((data, fields) => {
    const errors = validateFormData(data, fields);
    setFormErrors(errors);
  }, 300),
  [setFormErrors]
);

// Optimized field change handler
const handleFieldChange = useCallback((fieldName, value) => {
  setLocalData(prev => ({ ...prev, [fieldName]: value }));
  
  // Trigger debounced validation
  debouncedValidation({ ...localData, [fieldName]: value }, fields);
}, [localData, fields, debouncedValidation]);
```

### 9.3 Memory Management
```javascript
// Clean up event listeners and timeouts
useEffect(() => {
  const handleMessage = (event) => {
    // Handle platform messages
  };
  
  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
    // Clean up any debounced functions
    debouncedValidation.cancel();
  };
}, []);
```

---

## 10. Backward Compatibility Strategy

### 10.1 Version Detection
```javascript
// Detect platform version and adapt accordingly
function detectPlatformVersion(urlParams) {
  const rsvpConfigParam = urlParams.get('rsvpConfig');
  
  if (rsvpConfigParam) {
    try {
      const config = JSON.parse(decodeURIComponent(rsvpConfigParam));
      return config.version || '2.0'; // New system
    } catch (error) {
      return '1.0'; // Legacy system
    }
  }
  
  return '1.0'; // Legacy fallback
}
```

### 10.2 Adaptive Rendering
```javascript
// Adapt interface based on platform capabilities
const AdaptiveRSVPSection = ({ platformVersion, ...props }) => {
  if (platformVersion === '1.0') {
    // Render legacy simple RSVP
    return <LegacyRSVPSection {...props} />;
  }
  
  // Render enhanced RSVP
  return <EnhancedRSVPSection {...props} />;
};
```

---

## 11. Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Update TypeScript interfaces and types
- [ ] Implement enhanced URL parameter parsing
- [ ] Create basic form renderer components
- [ ] Set up testing framework

### Phase 2: Core Features (Week 2)
- [ ] Implement dynamic RSVP interface switching
- [ ] Add comprehensive form validation system
- [ ] Integrate all field type renderers
- [ ] Apply royal theme styling

### Phase 3: Advanced Features (Week 3)
- [ ] Add real-time validation with debouncing
- [ ] Implement edit-after-submit functionality
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Performance optimization (lazy loading, memoization)

### Phase 4: Testing & Integration (Week 4)
- [ ] Comprehensive unit and integration testing
- [ ] Cross-browser compatibility testing
- [ ] Mobile responsiveness verification
- [ ] Platform integration testing

### Phase 5: Deployment & Monitoring (Week 5)
- [ ] Staging environment deployment
- [ ] Production deployment with gradual rollout
- [ ] Monitor performance metrics and error rates
- [ ] Gather user feedback and iterate

---

## 12. Support & Documentation

### 12.1 Technical Support Channels
- **Primary Contact**: Platform Integration Team (platform-integration@company.com)
- **RSVP System Specialist**: RSVP Development Team (rsvp-support@company.com)
- **Emergency Support**: 24/7 Technical Hotline

### 12.2 Documentation Resources
- [Platform API Documentation](https://docs.platform.com/api/)
- [RSVP Field Types Reference](https://docs.platform.com/rsvp-fields/)
- [PostMessage Communication Guide](https://docs.platform.com/postmessage/)
- [Testing Best Practices](https://docs.platform.com/testing/)

### 12.3 Development Tools & Resources
- TypeScript definition files for all interfaces
- Jest testing utilities and mock helpers
- Storybook component documentation
- Performance monitoring and analytics tools
- Code review checklist and guidelines

---

## 13. Quality Assurance Checklist

### 13.1 Pre-deployment Verification
- [ ] All RSVP configuration types render correctly
- [ ] Form validation works for all field types
- [ ] Error handling gracefully manages edge cases
- [ ] Mobile responsive design functions properly
- [ ] Accessibility standards are met (WCAG 2.1 AA)
- [ ] Performance benchmarks are within acceptable limits
- [ ] Cross-browser compatibility confirmed
- [ ] Integration tests pass with 100% success rate

### 13.2 Post-deployment Monitoring
- [ ] RSVP submission success rates
- [ ] Form validation error frequency
- [ ] Page load performance metrics
- [ ] User engagement and completion rates
- [ ] Error logging and monitoring alerts
- [ ] Guest feedback and satisfaction scores

---

## 14. Future Enhancements Roadmap

### Short-term (Next 3 months)
- Multi-language support for international events
- Advanced field types (file upload, signature, location picker)
- Real-time collaborative editing for group RSVPs
- Enhanced analytics and reporting capabilities

### Medium-term (6 months)
- AI-powered smart field suggestions
- Integration with external calendar systems
- Advanced conditional logic for dynamic forms
- Offline support with data synchronization

### Long-term (12 months)
- Voice-activated RSVP responses
- AR/VR integration for immersive experiences
- Blockchain-based invitation verification
- Advanced personalization and recommendations

---

## Conclusion

This comprehensive integration guide provides everything needed to successfully migrate the Royal Wedding template to the enhanced RSVP system. The implementation ensures backward compatibility while enabling powerful new data collection capabilities that will significantly improve the event planning experience.

The platform's enhanced data flow architecture seamlessly communicates with your updated template through robust URL parameters and PostMessage systems, providing hosts with sophisticated RSVP management tools while maintaining the elegant, culturally-rich user experience your template is renowned for.

**Implementation Success Metrics:**
- 95%+ RSVP completion rate
- 99.9% uptime and reliability
- <2 second page load times
- 100% accessibility compliance
- Seamless mobile experience across all devices

For immediate technical assistance during implementation, contact the Platform Integration Team with reference code: **RWT-INT-2025-001**

---

*Document Classification: Technical Implementation Guide*  
*Last Updated: July 2025*  
*Next Review: August 2025*