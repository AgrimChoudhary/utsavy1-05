// Test script for wish submission functionality
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://xieiyoyiuhzrhwqhfmuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWishSubmission() {
  console.log('🧪 Testing Wish Submission...');
  
  try {
    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, custom_event_id, name')
      .limit(1);
    
    if (eventsError) {
      console.error('❌ Database connection failed:', eventsError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Found events:', events?.length || 0);
    
    if (events && events.length > 0) {
      const testEvent = events[0];
      console.log('🎯 Using test event:', testEvent);
      
      // 2. Test guest lookup
      console.log('2️⃣ Testing guest lookup...');
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('id, custom_guest_id, name')
        .eq('event_id', testEvent.id)
        .limit(1);
      
      if (guestsError) {
        console.error('❌ Guest lookup failed:', guestsError);
        return;
      }
      
      console.log('✅ Guest lookup successful');
      console.log('📊 Found guests:', guests?.length || 0);
      
      if (guests && guests.length > 0) {
        const testGuest = guests[0];
        console.log('👤 Using test guest:', testGuest);
        
        // 3. Test wish submission
        console.log('3️⃣ Testing wish submission...');
        const testWish = {
          event_id: testEvent.id,
          guest_id: testGuest.id,
          guest_name: testGuest.name,
          wish_text: 'Test wish from script - ' + new Date().toISOString(),
          is_approved: false,
          likes_count: 0
        };
        
        console.log('📝 Submitting test wish:', testWish);
        
        const { data: wish, error: wishError } = await supabase
          .from('wishes')
          .insert(testWish)
          .select()
          .single();
        
        if (wishError) {
          console.error('❌ Wish submission failed:', wishError);
          return;
        }
        
        console.log('✅ Wish submission successful!');
        console.log('🎁 Created wish:', wish);
        
        // 4. Test wish retrieval
        console.log('4️⃣ Testing wish retrieval...');
        const { data: retrievedWishes, error: retrieveError } = await supabase
          .from('wishes')
          .select('*')
          .eq('event_id', testEvent.id)
          .eq('is_approved', false);
        
        if (retrieveError) {
          console.error('❌ Wish retrieval failed:', retrieveError);
          return;
        }
        
        console.log('✅ Wish retrieval successful');
        console.log('📊 Found wishes for event:', retrievedWishes?.length || 0);
        
        // 5. Test wish approval
        console.log('5️⃣ Testing wish approval...');
        const { error: approveError } = await supabase
          .from('wishes')
          .update({ is_approved: true })
          .eq('id', wish.id);
        
        if (approveError) {
          console.error('❌ Wish approval failed:', approveError);
          return;
        }
        
        console.log('✅ Wish approval successful');
        
        // 6. Test approved wish retrieval
        console.log('6️⃣ Testing approved wish retrieval...');
        const { data: approvedWishes, error: approvedError } = await supabase
          .from('wishes')
          .select('*')
          .eq('event_id', testEvent.id)
          .eq('is_approved', true);
        
        if (approvedError) {
          console.error('❌ Approved wish retrieval failed:', approvedError);
          return;
        }
        
        console.log('✅ Approved wish retrieval successful');
        console.log('📊 Found approved wishes:', approvedWishes?.length || 0);
        
        console.log('\n🎉 ALL TESTS PASSED! Wish submission system is working correctly.');
        
      } else {
        console.log('⚠️ No guests found for test event');
      }
    } else {
      console.log('⚠️ No events found in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWishSubmission();



