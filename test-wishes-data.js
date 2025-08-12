const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleWishes() {
  console.log('🎁 Adding sample wishes data...');
  
  // Sample event ID - replace with actual event ID from your database
  const eventId = 'test-event-123';
  
  const sampleWishes = [
    {
      event_id: eventId,
      guest_id: 'guest-1',
      guest_name: 'Priya Sharma',
      wish_text: 'Wishing you both a lifetime of love, laughter, and beautiful memories together! 💕',
      photo_url: null,
      likes_count: 5,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      event_id: eventId,
      guest_id: 'guest-2',
      guest_name: 'Rahul Verma',
      wish_text: 'May your love story be as beautiful as the stars in the sky. Congratulations! ✨',
      photo_url: null,
      likes_count: 3,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      event_id: eventId,
      guest_id: 'guest-3',
      guest_name: 'Anjali Patel',
      wish_text: 'Here\'s to a wonderful journey together filled with love, joy, and endless happiness! 🥂',
      photo_url: null,
      likes_count: 7,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      event_id: eventId,
      guest_id: 'guest-4',
      guest_name: 'Vikram Singh',
      wish_text: 'May your marriage be blessed with love, understanding, and countless beautiful moments! 🙏',
      photo_url: null,
      likes_count: 2,
      is_approved: false, // This one is pending approval
      created_at: new Date().toISOString()
    }
  ];
  
  try {
    // Insert sample wishes
    const { data, error } = await supabase
      .from('wishes')
      .insert(sampleWishes);
      
    if (error) {
      console.error('❌ Error adding sample wishes:', error);
      return;
    }
    
    console.log('✅ Successfully added sample wishes!');
    console.log('📊 Added wishes:', data?.length || 0);
    
    // Verify the data was added
    const { data: verifyData, error: verifyError } = await supabase
      .from('wishes')
      .select('*')
      .eq('event_id', eventId);
      
    if (verifyError) {
      console.error('❌ Error verifying wishes:', verifyError);
      return;
    }
    
    console.log('🔍 Verification - Total wishes for event:', verifyData?.length || 0);
    console.log('✅ Approved wishes:', verifyData?.filter(w => w.is_approved).length || 0);
    console.log('⏳ Pending wishes:', verifyData?.filter(w => !w.is_approved).length || 0);
    
    console.log('\n🎯 Sample wishes added successfully!');
    console.log('📝 Event ID for testing:', eventId);
    console.log('💡 Use this event ID in your invitation URL to test wishes functionality');
    
  } catch (error) {
    console.error('❌ Exception while adding sample wishes:', error);
  }
}

// Run the function
addSampleWishes();






