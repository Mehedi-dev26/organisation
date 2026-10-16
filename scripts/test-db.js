import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rbmhzcapomiiduknkfya.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NjQyMjIsImV4cCI6MjEwNzQ0MDIyMn0.7iXjvzzbw0Ln7hKauvV8kthAXOxTmXNezhsYQsdUQik";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDatabase() {
  console.log("=== SUPABASE DIAGNOSTIC TEST ===");
  console.log("Testing connection to:", SUPABASE_URL);

  const tables = [
    'news',
    'events',
    'gallery_images',
    'members',
    'committee_members',
    'blood_donors',
    'transactions',
    'site_settings',
    'payment_methods',
    'profiles',
    'user_roles'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
      if (error) {
        console.log(`❌ Table [${table}]: ERROR - ${error.message} (${error.code})`);
      } else {
        console.log(`✅ Table [${table}]: Count = ${data?.length || 0} rows. Sample:`, data && data.length > 0 ? JSON.stringify(data[0]).substring(0, 100) + '...' : 'empty');
      }
    } catch (err) {
      console.log(`💥 Table [${table}]: EXCEPTION - ${err.message}`);
    }
  }

  // Also test auth sign-in for candidate admins
  console.log("\n=== TESTING AUTH SIGN IN ===");
  const testUsers = [
    { email: 'mehedihasanwork25@gmail.com' },
    { email: 'mehedihasanwork25@mail.com' },
  ];

  // Try checking storage buckets
  console.log("\n=== TESTING STORAGE BUCKETS ===");
  try {
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (bucketErr) {
      console.log("❌ Storage listBuckets error:", bucketErr.message);
    } else {
      console.log("✅ Storage buckets found:", buckets.map(b => b.name));
      for (const b of buckets) {
        const { data: files } = await supabase.storage.from(b.name).list();
        console.log(`   Bucket [${b.name}] files:`, files?.map(f => f.name) || []);
      }
    }
  } catch (e) {
    console.log("💥 Storage exception:", e.message);
  }
}

checkDatabase();
