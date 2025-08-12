# 🎁 Wish Submission Debug Guide

## 🚨 **Problem**: Template se wish platform mein nahi ja raha hai

## 🔍 **Debug Steps**

### **Step 1: Template Side Check (web-wedding-invitation-42)**

#### 1.1 Check Template Console Logs
```javascript
// Template mein wish submit karne par ye logs check karein:
console.log('Submitting wish:', { content, guestId, guestName, hasImage: !!imageFile });
console.log('Sending wish data to platform:', wishData);
```

#### 1.2 Check Message Structure
Template se ye message ja raha hai:
```javascript
window.parent.postMessage({
  type: 'SUBMIT_NEW_WISH',
  payload: {
    guest_id: guestId,
    guest_name: guestName,
    content: content.trim(),
    image_data: imageData,
    image_filename: imageFile?.name || null,
    image_type: imageFile?.type || null
  }
}, '*');
```

### **Step 2: Platform Side Check (utsavy1-05)**

#### 2.1 Check Platform Console Logs
Platform mein ye logs check karein:
```javascript
// Message receive hone par
console.log('📥 TEMPLATE: Received message from platform:', event.data);
console.log('💕 PLATFORM: Processing wish message with WishMessageHandlerService...');
console.log('💕 PLATFORM: Message type detected:', messageEvent.data.type);
```

#### 2.2 Check Message Routing
```javascript
// Wish message types array mein SUBMIT_NEW_WISH hai ya nahi
const wishMessageTypes = [
  'REQUEST_INITIAL_WISHES_DATA',
  'REQUEST_INITIAL_ADMIN_WISHES_DATA',
  'SUBMIT_NEW_WISH',  // ✅ Ye hona chahiye
  'APPROVE_WISH',
  'DELETE_WISH',
  'TOGGLE_WISH_LIKE',
  'REQUEST_WISHES_REFRESH',
  'SUBMIT_WISH_REPLY'
];
```

#### 2.3 Check Handler Registration
```javascript
// Handler register hua hai ya nahi
console.log('🔗 PLATFORM: Currently registered handlers:', WishMessageHandlerService.getRegisteredHandlers());
console.log('🔍 PLATFORM: Is eventId already registered?', WishMessageHandlerService.getRegisteredHandlers().includes(eventId));
```

### **Step 3: WishMessageHandlerService Check**

#### 3.1 Check Service Logs
```javascript
// Service mein ye logs check karein:
console.log('📝 Submitting new wish for event:', eventId, 'by guest:', payload.guest_name);
console.log('📦 Wish content:', payload.content);
console.log('🔍 Complete payload received:', JSON.stringify(payload, null, 2));
```

#### 3.2 Check Database Operations
```javascript
// Database operations check karein:
console.log('💾 Wish data being inserted:', JSON.stringify(wishData, null, 2));
console.log('📤 About to insert wish into database...');
```

### **Step 4: Database Check**

#### 4.1 Check Supabase Connection
```sql
-- Check if wishes table exists
SELECT * FROM wishes LIMIT 1;

-- Check table structure
\d wishes;
```

#### 4.2 Check RLS Policies
```sql
-- Check RLS policies on wishes table
SELECT * FROM pg_policies WHERE tablename = 'wishes';
```

## 🛠️ **Common Issues & Solutions**

### **Issue 1: Message Not Received by Platform**
**Symptoms:**
- Template console mein message sent log hai
- Platform console mein koi log nahi aata

**Solutions:**
1. Check iframe selector: `iframe[data-template-iframe="true"]`
2. Check origin validation
3. Check message type filtering

### **Issue 2: Handler Not Registered**
**Symptoms:**
- Platform console mein "No wish message handler found" error

**Solutions:**
1. Check iframe exists
2. Check eventId format
3. Manually register handler

### **Issue 3: Database Insertion Failed**
**Symptoms:**
- Platform console mein database error

**Solutions:**
1. Check Supabase credentials
2. Check RLS policies
3. Check table structure
4. Check event_id and guest_id resolution

### **Issue 4: Guest/Event ID Resolution Failed**
**Symptoms:**
- "Event not found" or "Guest not found" errors

**Solutions:**
1. Check if using custom_event_id vs actual UUID
2. Check if using custom_guest_id vs actual UUID
3. Verify data exists in database

## 🧪 **Test Script Usage**

### **Step 1: Update Credentials**
```javascript
// test-wish-submission.js mein apne Supabase credentials daalein
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

### **Step 2: Run Test**
```bash
node test-wish-submission.js
```

### **Step 3: Check Output**
- Database connection successful ✅
- Guest lookup successful ✅
- Wish submission successful ✅
- Wish retrieval successful ✅

## 🔧 **Manual Testing Steps**

### **Step 1: Template Testing**
1. Template page open karein
2. Wish submit karein
3. Console logs check karein
4. Message structure verify karein

### **Step 2: Platform Testing**
1. Platform page open karein
2. Template iframe load hone ka wait karein
3. Template se wish submit karein
4. Platform console logs check karein

### **Step 3: Database Testing**
1. Supabase dashboard open karein
2. Wishes table check karein
3. New wish entry verify karein

## 📊 **Expected Data Flow**

```
1. User submits wish in template
2. Template sends SUBMIT_NEW_WISH message
3. Platform receives message
4. Platform routes to WishMessageHandlerService
5. Service resolves event_id and guest_id
6. Service inserts wish into database
7. Service sends success response to template
8. Template shows success message
```

## 🚨 **Emergency Fixes**

### **Fix 1: Force Handler Registration**
```javascript
// Platform mein manually handler register karein
const iframe = document.querySelector('iframe[data-template-iframe="true"]');
if (iframe) {
  WishMessageHandlerService.registerHandler(eventId, iframe);
}
```

### **Fix 2: Bypass Message Routing**
```javascript
// Direct database insertion for testing
const wishData = {
  event_id: actualEventId,
  guest_id: actualGuestId,
  guest_name: guestName,
  wish_text: content,
  is_approved: false,
  likes_count: 0
};

const { data, error } = await supabase
  .from('wishes')
  .insert(wishData)
  .select();
```

### **Fix 3: Debug Message Structure**
```javascript
// Template mein message structure debug karein
console.log('🔍 Message being sent:', {
  type: 'SUBMIT_NEW_WISH',
  payload: wishData
});
```

## 📞 **Support Information**

Agar problem solve nahi ho raha hai to ye information share karein:
1. Template console logs
2. Platform console logs
3. Database error messages
4. Test script output
5. Browser network tab (if any errors)




