export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rbmhzcapomiiduknkfya.supabase.co';
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWh6Y2Fwb21paWR1a25rZnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NjQyMjIsImV4cCI6MjEwNzQ0MDIyMn0.7iXjvzzbw0Ln7hKauvV8kthAXOxTmXNezhsYQsdUQik';

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/news?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const latencyMs = Date.now() - startTime;
    const isOk = response.ok;

    return res.status(200).json({
      success: isOk,
      status: response.status,
      latencyMs,
      timestamp: new Date().toISOString(),
      message: isOk 
        ? 'Supabase Keep-Alive query executed successfully. Database remains active!' 
        : `Supabase returned status ${response.status}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Error pinging Supabase backend',
      timestamp: new Date().toISOString(),
    });
  }
}
