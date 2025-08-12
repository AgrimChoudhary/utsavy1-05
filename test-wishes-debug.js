const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - Replace with your actual credentials
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWishes() {
  console.log('🔍 Debugging wishes functionality...');
  
  // Step 1: Check if wishes table exists and has data
  console.log('\n📊 Step 1: Checking wishes table...');
  
  try {
    const { data: allWishes, error: allWishesError } = await supabase
      .from('wishes')
      .select('*')
      .limit(10);
      
    if (allWishesError) {
      console.error('❌ Error checking wishes table:', allWishesError);
      return;
    }
    
    console.log('✅ Wishes table accessible');
    console.log('📊 Total wishes in database:', allWishes?.length || 0);
    
    if (allWishes && allWishes.length > 0) {
      console.log('📝 Sample wish structure:', allWishes[0]);
    }
  } catch (error) {
    console.error('❌ Exception checking wishes table:', error);
    return;
  }
  
  // Step 2: Add sample wishes for testing
  console.log('\n🎁 Step 2: Adding sample wishes...');
  
  // Get a sample event ID (you'll need to replace this with an actual event ID)
  const sampleEventId = 'test-event-123'; // Replace with actual event ID
  
  const sampleWishes = [
    {
      event_id: sampleEventId,
      guest_id: 'guest-1',
      guest_name: 'Priya Sharma',
      wish_text: 'Wishing you both a lifetime of love, laughter, and beautiful memories together! 💕',
      photo_url: null,
      likes_count: 5,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      event_id: sampleEventId,
      guest_id: 'guest-2',
      guest_name: 'Rahul Verma',
      wish_text: 'May your love story be as beautiful as the stars in the sky. Congratulations! ✨',
      photo_url: null,
      likes_count: 3,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      event_id: sampleEventId,
      guest_id: 'guest-3',
      guest_name: 'Anjali Patel',
      wish_text: 'Here\'s to a wonderful journey together filled with love, joy, and endless happiness! 🥂',
      photo_url: null,
      likes_count: 7,
      is_approved: true,
      created_at: new Date().toISOString()
    },
    {
      event_id: sampleEventId,
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
    const { data: insertedWishes, error: insertError } = await supabase
      .from('wishes')
      .insert(sampleWishes)
      .select();
      
    if (insertError) {
      console.error('❌ Error inserting sample wishes:', insertError);
    } else {
      console.log('✅ Successfully added sample wishes!');
      console.log('📊 Inserted wishes:', insertedWishes?.length || 0);
    }
  } catch (error) {
    console.error('❌ Exception inserting sample wishes:', error);
  }
  
  // Step 3: Verify the data was added
  console.log('\n🔍 Step 3: Verifying sample wishes...');
  
  try {
    const { data: verifyWishes, error: verifyError } = await supabase
      .from('wishes')
      .select('*')
      .eq('event_id', sampleEventId);
      
    if (verifyError) {
      console.error('❌ Error verifying wishes:', verifyError);
    } else {
      console.log('✅ Verification successful');
      console.log('📊 Total wishes for event:', verifyWishes?.length || 0);
      console.log('✅ Approved wishes:', verifyWishes?.filter(w => w.is_approved).length || 0);
      console.log('⏳ Pending wishes:', verifyWishes?.filter(w => !w.is_approved).length || 0);
      
      if (verifyWishes && verifyWishes.length > 0) {
        console.log('📝 Sample approved wish:', verifyWishes.find(w => w.is_approved));
      }
    }
  } catch (error) {
    console.error('❌ Exception verifying wishes:', error);
  }
  
  // Step 4: Test the query that platform uses
  console.log('\n🎯 Step 4: Testing platform query...');
  
  try {
    const { data: platformWishes, error: platformError } = await supabase
      .from('wishes')
      .select('*')
      .eq('event_id', sampleEventId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
      
    if (platformError) {
      console.error('❌ Error in platform query:', platformError);
    } else {
      console.log('✅ Platform query successful');
      console.log('📊 Approved wishes for platform:', platformWishes?.length || 0);
      
      if (platformWishes && platformWishes.length > 0) {
        console.log('📝 Platform wish structure:', {
          id: platformWishes[0].id,
          guest_id: platformWishes[0].guest_id,
          guest_name: platformWishes[0].guest_name,
          wish_text: platformWishes[0].wish_text,
          photo_url: platformWishes[0].photo_url,
          likes_count: platformWishes[0].likes_count,
          is_approved: platformWishes[0].is_approved,
          created_at: platformWishes[0].created_at
        });
      }
    }
  } catch (error) {
    console.error('❌ Exception in platform query:', error);
  }
  
  console.log('\n🎯 Debug Summary:');
  console.log('📝 Event ID for testing:', sampleEventId);
  console.log('💡 Use this event ID in your invitation URL to test wishes functionality');
  console.log('🔍 Check browser console for detailed logs from platform and template');
  console.log('📊 Expected approved wishes:', 3);
  console.log('📊 Expected pending wishes:', 1);
}

// Run the debug function
debugWishes();






