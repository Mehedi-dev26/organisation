import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rbmhzcapomiiduknkfya.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NjQyMjIsImV4cCI6MjEwNzQ0MDIyMn0.7iXjvzzbw0Ln7hKauvV8kthAXOxTmXNezhsYQsdUQik";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectData() {
  const { data: news } = await supabase.from('news').select('id, title_bn, image_url, is_published');
  console.log("NEWS ITEMS:", JSON.stringify(news, null, 2));

  const { data: events } = await supabase.from('events').select('id, title_bn, image_url, is_published');
  console.log("EVENTS ITEMS:", JSON.stringify(events, null, 2));

  const { data: site_settings } = await supabase.from('site_settings').select('*');
  console.log("SITE SETTINGS:", JSON.stringify(site_settings, null, 2));

  const { data: members } = await supabase.from('members').select('*');
  console.log("MEMBERS:", JSON.stringify(members, null, 2));
}

inspectData();
