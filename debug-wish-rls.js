import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xieiyoyiuhzrhwqhfmuq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function debugWishRLS() {
  try {
    console.log('🔍 Debugging wish RLS policies...');
    
    // Get a test event and guest
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, wishes_enabled, custom_event_id')
      .limit(1);
    
    if (eventsError || !events || events.length === 0) {
      console.error('❌ No events found:', eventsError);
      return;
    }
    
    const testEvent = events[0];
    console.log('🎯 Using test event:', testEvent);
    
    // Get a guest for this event
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, name, event_id, custom_guest_id')
      .eq('event_id', testEvent.id)
      .limit(1);
    
    if (guestsError || !guests || guests.length === 0) {
      console.error('❌ No guests found for this event:', guestsError);
      return;
    }
    
    const testGuest = guests[0];
    console.log('👤 Using test guest:', testGuest);
    
    // Validate that the guest belongs to the event
    console.log('🔍 Validation check:');
    console.log(`  - Guest event_id: ${testGuest.event_id}`);
    console.log(`  - Test event id: ${testEvent.id}`);
    console.log(`  - Match: ${testGuest.event_id === testEvent.id}`);
    
    // Check if RLS policies are properly configured
    console.log('\n🔍 Checking RLS policy conditions...');
    
    // Test the guest exists condition
    const { data: guestExists, error: guestExistsError } = await supabase
      .from('guests')
      .select('id, event_id')
      .eq('id', testGuest.id)
      .eq('event_id', testEvent.id);
    
    console.log('👤 Guest exists check:', {
      found: guestExists?.length || 0,
      error: guestExistsError,
      data: guestExists
    });
    
    // Test the event wishes enabled condition
    const { data: eventWishesEnabled, error: eventError } = await supabase
      .from('events')
      .select('id, wishes_enabled')
      .eq('id', testEvent.id);
    
    console.log('🎯 Event wishes enabled check:', {
      found: eventWishesEnabled?.length || 0,
      error: eventError,
      wishes_enabled: eventWishesEnabled?.[0]?.wishes_enabled
    });
    
    // Try to insert a test wish
    console.log('\n📝 Attempting wish insertion...');
    const testWish = {
      event_id: testEvent.id,
      guest_id: testGuest.id,
      guest_name: testGuest.name,
      wish_text: 'Test wish from RLS debug - ' + new Date().toISOString(),
      is_approved: false,
      likes_count: 0
    };
    
    console.log('📝 Test wish data:', testWish);
    
    const { data: insertedWish, error: insertError } = await supabase
      .from('wishes')
      .insert(testWish)
      .select();
    
    if (insertError) {
      console.error('❌ Wish insertion failed:', insertError);
      
      // Try to understand why
      console.log('\n🔍 Investigating RLS failure...');
      
      // Check current RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc('pg_get_object_info', {
          object_class: 'pg_policy',
          object_name: 'wishes'
        });
      
      if (policiesError) {
        console.log('Could not fetch policies:', policiesError);
      } else {
        console.log('📋 Current policies:', policies);
      }
      
    } else {
      console.log('✅ Wish insertion successful!', insertedWish);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

debugWishRLS();

