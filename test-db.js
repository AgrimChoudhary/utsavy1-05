import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xieiyoyiuhzrhwqhfmuq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZWl5b3lpdWh6cmh3cWhmbXVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NTQ1ODQsImV4cCI6MjA2NTUzMDU4NH0.LKkdmSDWsq_8PfJ3iCTAaU8MAd9TlrgMv37x5tuuwNg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Check if wishes table exists
    console.log('🔍 Testing if wishes table exists...');
    const { data: tableTest, error: tableError } = await supabase
      .from("wishes")
      .select("count")
      .limit(1);
    
    console.log('📊 Table test result:', { tableTest, tableError });
    
    // Test 2: Check total wishes count
    console.log('🔍 Testing total wishes count...');
    const { count, error: countError } = await supabase
      .from("wishes")
      .select("*", { count: 'exact', head: true });
    
    console.log('📊 Count test result:', { count, countError });
    
    // Test 3: Check table structure
    console.log('🔍 Testing table structure...');
    const { data: structureTest, error: structureError } = await supabase
      .from("wishes")
      .select("*")
      .limit(1);
    
    console.log('📊 Structure test result:', { 
      hasData: !!structureTest, 
      error: structureError,
      columns: structureTest && structureTest.length > 0 ? Object.keys(structureTest[0]) : []
    });
    
    // Test 4: Check RLS policies
    console.log('🔍 Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from("wishes")
      .select("id,event_id,guest_name,wish_text")
      .limit(5);
    
    console.log('📊 RLS test result:', { rlsTest, rlsError, count: rlsTest?.length || 0 });
    
    console.log('✅ Database test completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();

