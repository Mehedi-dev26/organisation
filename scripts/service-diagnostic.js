import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rbmhzcapomiiduknkfya.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg2NDIyMiwiZXhwIjoyMTA3NDQwMjIyfQ.XDgizTMeeZjJTuKk-luAMZEj4qubQizBTmKxs3M-J5M";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log("=== CHECKING AUTH USERS (via admin api) ===");
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.log("❌ listUsers error:", usersErr);
  } else {
    console.log(`Found ${usersData.users.length} users:`);
    for (const u of usersData.users) {
      console.log(`- ID: ${u.id}`);
      console.log(`  Email: ${u.email} (confirmed: ${!!u.email_confirmed_at})`);
      console.log(`  Phone: ${u.phone}`);
      console.log(`  Metadata:`, u.user_metadata);
      console.log(`  Created: ${u.created_at}, Last Sign In: ${u.last_sign_in_at}`);
    }
  }

  console.log("\n=== CHECKING USER ROLES TABLE ===");
  const { data: roles, error: rolesErr } = await supabase.from('user_roles').select('*');
  console.log("Roles count:", roles?.length, roles || rolesErr);

  console.log("\n=== CHECKING PROFILES TABLE ===");
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  console.log("Profiles count:", profiles?.length, profiles || profErr);

  console.log("\n=== CHECKING GALLERY IMAGES ===");
  const { data: gallery, error: galErr } = await supabase.from('gallery_images').select('*');
  console.log("Gallery count:", gallery?.length);

  console.log("\n=== CHECKING COMMITTEE MEMBERS ===");
  const { data: committee, error: commErr } = await supabase.from('committee_members').select('*');
  console.log("Committee count:", committee?.length);
}

run();
