import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rbmhzcapomiiduknkfya.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTg2NDIyMiwiZXhwIjoyMTA3NDQwMjIyfQ.XDgizTMeeZjJTuKk-luAMZEj4qubQizBTmKxs3M-J5M";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function setupBuckets() {
  const bucketsToCreate = ['member-photos', 'gallery', 'news-images', 'site-assets'];

  for (const bucketName of bucketsToCreate) {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (error) {
      console.log(`Bucket [${bucketName}]:`, error.message);
    } else {
      console.log(`✅ Bucket [${bucketName}] created successfully!`);
    }
  }

  const { data: allBuckets } = await supabase.storage.listBuckets();
  console.log("Current storage buckets:", allBuckets?.map(b => b.name));
}

setupBuckets();
