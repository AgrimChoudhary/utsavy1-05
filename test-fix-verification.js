// Test script to verify the wish fix is working
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xieiyoyiuhzrhwqhfmuq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWishSubmission() {
  console.log('🧪 Testing wish submission after RLS fix...');
  
  try {
    // Use the same test data from debug script
    const testWish = {
      event_id: '3a7bad71-6654-4888-b325-5a652fba4d41',
      guest_id: '91adab0f-cdbd-492d-abf4-bf6c0815ddb6',
      guest_name: 'A',
      wish_text: 'Test wish after RLS fix - ' + new Date().toISOString(),
      is_approved: false,
      likes_count: 0
    };
    
    console.log('📝 Attempting to insert test wish...');
    const { data: insertedWish, error: wishError } = await supabase
      .from('wishes')
      .insert(testWish)
      .select()
      .single();
    
    if (wishError) {
      console.log('❌ Wish insertion still failed:');
      console.log('Error:', wishError);
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Copy the SQL from URGENT_RLS_FIX.sql');
      console.log('2. Go to your Supabase dashboard');
      console.log('3. Open SQL Editor');
      console.log('4. Paste and run the SQL');
      console.log('5. Run this test script again');
      return false;
    } else {
      console.log('✅ SUCCESS! Wish insertion is now working!');
      console.log('🎁 Created wish:', insertedWish);
      
      // Clean up test wish
      await supabase.from('wishes').delete().eq('id', insertedWish.id);
      console.log('🧹 Cleaned up test wish');
      
      console.log('');
      console.log('🎉 WISH SUBMISSION IS NOW FIXED!');
      console.log('');
      console.log('📋 What to test next:');
      console.log('1. Open your template (web-wedding-invitation-42)');
      console.log('2. Submit a real wish from the interface');
      console.log('3. Check if it appears in the main platform dashboard');
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testWishSubmission();
