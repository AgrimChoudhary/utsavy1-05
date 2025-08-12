import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xieiyoyiuhzrhwqhfmuq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkEventWishes() {
  try {
    console.log('🔍 Checking event wishes configuration...');
    
    // Check events and their wishes_enabled status
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, wishes_enabled, custom_event_id')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }
    
    console.log('📊 Found events:', events?.length || 0);
    events?.forEach(event => {
      console.log(`  - ${event.name} (${event.id})`);
      console.log(`    Custom ID: ${event.custom_event_id || 'None'}`);
      console.log(`    Wishes enabled: ${event.wishes_enabled ?? 'null (defaults to true)'}`);
    });
    
    // Update events to enable wishes if needed
    console.log('\n🔧 Ensuring wishes are enabled for all events...');
    const { data: updatedEvents, error: updateError } = await supabase
      .from('events')
      .update({ wishes_enabled: true })
      .neq('wishes_enabled', true)
      .select('id, name, wishes_enabled');
    
    if (updateError) {
      console.error('❌ Error updating events:', updateError);
    } else {
      console.log('✅ Updated events:', updatedEvents?.length || 0);
      updatedEvents?.forEach(event => {
        console.log(`  - Enabled wishes for: ${event.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

checkEventWishes();

