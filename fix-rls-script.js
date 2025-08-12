// Script to fix RLS policies for wishes table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xieiyoyiuhzrhwqhfmuq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg'; // Using anon key for now

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Starting RLS policy fix for wishes table...');
  
  try {
    // Drop existing policies
    console.log('🗑️ Step 1: Dropping existing policies...');
    
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Anyone can view approved wishes" ON public.wishes;`
    }).then(result => {
      if (result.error) throw result.error;
      console.log('✅ Dropped old SELECT policy');
    });

    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Guests can create wishes" ON public.wishes;`
    }).then(result => {
      if (result.error) throw result.error;
      console.log('✅ Dropped old INSERT policy');
    });

    // Create new SELECT policy
    console.log('📝 Step 2: Creating new SELECT policy...');
    const selectPolicySQL = `
      CREATE POLICY "Anyone can view approved wishes"
      ON public.wishes
      FOR SELECT
      USING (
        is_approved = true
        AND EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
        )
      );
    `;
    
    await supabase.rpc('exec_sql', { sql: selectPolicySQL }).then(result => {
      if (result.error) throw result.error;
      console.log('✅ Created new SELECT policy');
    });

    // Create new INSERT policy
    console.log('📝 Step 3: Creating new INSERT policy...');
    const insertPolicySQL = `
      CREATE POLICY "Guests can create wishes"
      ON public.wishes
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.guests g
          WHERE g.id = wishes.guest_id AND g.event_id = wishes.event_id
        )
        AND EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
        )
      );
    `;
    
    await supabase.rpc('exec_sql', { sql: insertPolicySQL }).then(result => {
      if (result.error) throw result.error;
      console.log('✅ Created new INSERT policy');
    });

    console.log('🎉 RLS policies fixed successfully!');
    console.log('🔄 Now testing wish insertion again...');
    
    // Test wish insertion
    const testWish = {
      event_id: '3a7bad71-6654-4888-b325-5a652fba4d41',
      guest_id: '91adab0f-cdbd-492d-abf4-bf6c0815ddb6',
      guest_name: 'A',
      wish_text: 'Test wish after RLS fix - ' + new Date().toISOString(),
      is_approved: false,
      likes_count: 0
    };
    
    const { data: insertedWish, error: wishError } = await supabase
      .from('wishes')
      .insert(testWish)
      .select()
      .single();
    
    if (wishError) {
      console.log('❌ Test insertion still failed:', wishError);
    } else {
      console.log('✅ Test wish insertion successful!');
      console.log('🎁 Created wish:', insertedWish);
      
      // Clean up test wish
      await supabase.from('wishes').delete().eq('id', insertedWish.id);
      console.log('🧹 Cleaned up test wish');
    }
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

// Alternative approach: Use direct SQL if exec_sql doesn't work
async function fixRLSAlternative() {
  console.log('🔧 Alternative approach: Fixing RLS using admin connection...');
  
  try {
    // First, enable RLS if not already enabled
    const enableRLSSQL = `ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;`;
    
    // Drop and recreate policies using raw SQL
    const fullSQL = `
      -- Drop existing policies
      DROP POLICY IF EXISTS "Anyone can view approved wishes" ON public.wishes;
      DROP POLICY IF EXISTS "Guests can create wishes" ON public.wishes;
      
      -- Create new SELECT policy
      CREATE POLICY "Anyone can view approved wishes"
      ON public.wishes
      FOR SELECT
      USING (
        is_approved = true
        AND EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
        )
      );
      
      -- Create new INSERT policy
      CREATE POLICY "Guests can create wishes"
      ON public.wishes
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.guests g
          WHERE g.id = wishes.guest_id AND g.event_id = wishes.event_id
        )
        AND EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.id = wishes.event_id AND COALESCE(e.wishes_enabled, true) = true
        )
      );
    `;

    console.log('📝 Executing SQL commands...');
    console.log('⚠️ Note: This requires service role or admin access');
    console.log('SQL to execute:', fullSQL);
    
  } catch (error) {
    console.error('❌ Error in alternative approach:', error);
  }
}

// Run the fix
console.log('🚀 Starting RLS fix process...');
fixRLSPolicies().then(() => {
  console.log('✅ RLS fix process completed');
}).catch(() => {
  console.log('⚠️ Primary method failed, showing alternative SQL...');
  fixRLSAlternative();
});
