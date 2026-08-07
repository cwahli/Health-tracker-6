const fs = require('fs');
let content = fs.readFileSync('src/jobs/SupabaseJobSync.ts', 'utf8');

const replacement = `
export async function upsertJobToSupabase(
  job: AgentJob,
  userId: string = 'anonymous',
  photoUrl?: string,
  debugUrl?: string,
  cleanResult?: any
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const payload = {
      id: job.id,
      user_id: userId,
      kind: job.kind,
      mode: job.mode || 'review',
      status: job.status,
      progress_percent: job.progressPercent || 0,
      status_message: job.statusMessage || '',
      photo_url: photoUrl || job.result?.photoUrl || null,
      debug_url: debugUrl || job.result?.debugUrl || null,
      clean_result: cleanResult || job.result || null,
      updated_at: new Date().toISOString(),
    };
    
    // Push through the server to avoid exposing anon keys / RLS issues directly from client for writes
    const res = await fetch('/api/jobs/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (!res.ok) {
      throw new Error('Failed to upsert job via backend');
    }
  } catch (err) {
    console.warn('[SupabaseJobSync] Failed to upsert job to backend/Supabase:', err);
  }
}
`;

content = content.replace(/export async function upsertJobToSupabase[\s\S]*/, replacement.trim());
fs.writeFileSync('src/jobs/SupabaseJobSync.ts', content);
