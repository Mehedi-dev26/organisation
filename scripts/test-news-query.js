import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rbmhzcapomiiduknkfya.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NjQyMjIsImV4cCI6MjEwNzQ0MDIyMn0.7iXjvzzbw0Ln7hKauvV8kthAXOxTmXNezhsYQsdUQik";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  console.log("Error:", error);
  console.log("Count:", data?.length);
  data?.forEach(d => {
    console.log(`- ${d.title_bn}`);
    console.log(`  published_at: ${d.published_at}`);
    console.log(`  image_url: ${d.image_url}`);
  });
}

testNews();
