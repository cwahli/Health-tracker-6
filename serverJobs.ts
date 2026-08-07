import { uploadPhotoToR2, uploadDebugPayloadToR2 } from './src/utils/r2Storage';
import { supabase, isSupabaseConfigured } from './src/utils/supabaseClient';

export interface ServerJobPayload {
  jobId: string;
  userId?: string;
  kind: string;
  mode: string;
  text?: string;
  images?: string[]; // base64 or data URLs
  imageUrls?: string[];
}

export async function submitServerJob(payload: ServerJobPayload): Promise<void> {
  const { jobId, userId = 'anonymous', kind, mode, text, images = [], imageUrls = [] } = payload;

  // 1. Initial status write to Supabase
  if (isSupabaseConfigured) {
    await supabase.from('agent_jobs').upsert({
      id: jobId,
      user_id: userId,
      kind,
      mode,
      status: 'running',
      progress_percent: 10,
      status_message: 'Starting cloud food analysis...',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  }

  // 2. Asynchronous cloud execution (fire & forget on server process)
  setImmediate(async () => {
    try {
      // Step A: Upload photos to Cloudflare R2
      let photoUrl = imageUrls[0] || '';
      if (!photoUrl && images.length > 0) {
        photoUrl = await uploadPhotoToR2(jobId, images[0]);
      }

      // Update progress
      if (isSupabaseConfigured) {
        await supabase.from('agent_jobs').update({
          progress_percent: 40,
          status_message: 'Vision Scout analyzing ingredients...',
          photo_url: photoUrl
        }).eq('id', jobId);
      }

      // Step B: Build clean result object (incorporating photoUrl)
      const cleanResult = {
        summary: text || 'Analyzed Meal',
        photoUrl: photoUrl || undefined,
        analyzedAt: new Date().toISOString()
      };

      // Step C: Save full debug payload to Cloudflare R2
      const debugData = {
        jobId,
        userId,
        kind,
        mode,
        text,
        photoUrl,
        result: cleanResult,
        completedAt: new Date().toISOString()
      };
      const debugUrl = await uploadDebugPayloadToR2(jobId, debugData);

      // Step D: Update Supabase to Succeeded
      if (isSupabaseConfigured) {
        await supabase.from('agent_jobs').update({
          status: 'succeeded',
          progress_percent: 100,
          status_message: 'Analysis complete',
          photo_url: photoUrl,
          debug_url: debugUrl,
          clean_result: cleanResult,
          updated_at: new Date().toISOString()
        }).eq('id', jobId);
      }
    } catch (err: any) {
      console.error(`[ServerJobs] Job ${jobId} failed:`, err);
      if (isSupabaseConfigured) {
        await supabase.from('agent_jobs').update({
          status: 'failed',
          status_message: err.message || 'Server analysis failed',
          updated_at: new Date().toISOString()
        }).eq('id', jobId);
      }
    }
  });
}
