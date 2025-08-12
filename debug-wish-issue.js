// Debug script to identify wish submission issues
// यह script exact problem identify करेगी

import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://xieiyoyiuhzrhwqhfmuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWishIssue() {
  console.log('🔍 Starting wish submission debug...');
  
  try {
    // Step 1: Check events table
    console.log('\n📊 Step 1: Checking events...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, custom_event_id, name, wishes_enabled')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Events query failed:', eventsError);
      return;
    }
    
    console.log('✅ Found events:', events?.length || 0);
    if (events && events.length > 0) {
      console.log('📋 Sample event:', events[0]);
      
      const testEvent = events[0];
      
      // Step 2: Check guests for this event
      console.log('\n👥 Step 2: Checking guests for event:', testEvent.name);
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('id, custom_guest_id, name, event_id')
        .eq('event_id', testEvent.id)
        .limit(3);
      
      if (guestsError) {
        console.error('❌ Guests query failed:', guestsError);
        return;
      }
      
      console.log('✅ Found guests:', guests?.length || 0);
      if (guests && guests.length > 0) {
        console.log('👤 Sample guest:', guests[0]);
        
        const testGuest = guests[0];
        
        // Step 3: Check wishes_enabled
        console.log('\n🎁 Step 3: Checking wishes configuration...');
        console.log('Wishes enabled for event:', testEvent.wishes_enabled);
        
        if (testEvent.wishes_enabled === false) {
          console.log('⚠️ ISSUE FOUND: Wishes are disabled for this event!');
          console.log('💡 SOLUTION: Enable wishes for this event');
          return;
        }
        
        // Step 4: Test ID resolution (simulate what WishMessageHandlerService does)
        console.log('\n🔍 Step 4: Testing ID resolution...');
        
        // Test using custom_event_id (what template might send)
        const templateEventId = testEvent.custom_event_id || testEvent.id;
        const templateGuestId = testGuest.custom_guest_id || testGuest.id;
        
        console.log('Template would send - Event ID:', templateEventId, 'Guest ID:', templateGuestId);
        
        // Test resolution from custom_event_id to actual ID
        const { data: resolvedEvent } = await supabase
          .from('events')
          .select('id')
          .eq('id', templateEventId)
          .single();
        
        if (!resolvedEvent) {
          // Try as custom_event_id
          const { data: resolvedEventByCustom } = await supabase
            .from('events')
            .select('id')
            .eq('custom_event_id', templateEventId)
            .single();
          
          if (!resolvedEventByCustom) {
            console.log('❌ ISSUE FOUND: Event ID cannot be resolved!');
            console.log('Template Event ID:', templateEventId);
            console.log('💡 SOLUTION: Check event ID mapping');
            return;
          } else {
            console.log('✅ Event resolved via custom_event_id');
          }
        } else {
          console.log('✅ Event resolved via direct ID');
        }
        
        // Test resolution from custom_guest_id to actual ID
        const { data: resolvedGuest } = await supabase
          .from('guests')
          .select('id')
          .eq('id', templateGuestId)
          .single();
        
        if (!resolvedGuest) {
          // Try as custom_guest_id
          const { data: resolvedGuestByCustom } = await supabase
            .from('guests')
            .select('id')
            .eq('custom_guest_id', templateGuestId)
            .single();
          
          if (!resolvedGuestByCustom) {
            console.log('❌ ISSUE FOUND: Guest ID cannot be resolved!');
            console.log('Template Guest ID:', templateGuestId);
            console.log('💡 SOLUTION: Check guest ID mapping');
            return;
          } else {
            console.log('✅ Guest resolved via custom_guest_id');
          }
        } else {
          console.log('✅ Guest resolved via direct ID');
        }
        
        // Step 5: Test actual wish insertion
        console.log('\n🎁 Step 5: Testing wish insertion...');
        
        const testWish = {
          event_id: testEvent.id,
          guest_id: testGuest.id,
          guest_name: testGuest.name,
          wish_text: 'Test wish from debug script - ' + new Date().toISOString(),
          is_approved: false,
          likes_count: 0
        };
        
        console.log('📝 Inserting test wish:', testWish);
        
        const { data: insertedWish, error: wishError } = await supabase
          .from('wishes')
          .insert(testWish)
          .select()
          .single();
        
        if (wishError) {
          console.log('❌ ISSUE FOUND: Wish insertion failed!');
          console.error('Database error:', wishError);
          console.log('💡 Possible reasons:');
          console.log('   - RLS policies blocking insertion');
          console.log('   - Missing permissions');
          console.log('   - Invalid foreign key references');
          return;
        }
        
        console.log('✅ Wish insertion successful!');
        console.log('🎁 Created wish:', insertedWish);
        
        // Step 6: Clean up test wish
        await supabase
          .from('wishes')
          .delete()
          .eq('id', insertedWish.id);
        
        console.log('\n🎉 ALL TESTS PASSED! Wish system should be working.');
        console.log('🔍 If you\'re still having issues, check:');
        console.log('   1. Template console logs for postMessage errors');
        console.log('   2. Platform console logs for message handling');
        console.log('   3. Ensure iframe is properly loaded');
        console.log('   4. Check browser network tab for errors');
      } else {
        console.log('❌ ISSUE FOUND: No guests found for event!');
        console.log('💡 SOLUTION: Add guests to this event first');
      }
    } else {
      console.log('❌ ISSUE FOUND: No events found!');
      console.log('💡 SOLUTION: Create an event first');
    }
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

// Run the debug
debugWishIssue();


