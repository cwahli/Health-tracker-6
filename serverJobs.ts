import { uploadPhotoToR2, uploadDebugPayloadToR2 } from './src/utils/r2Storage';
import { supabase, isSupabaseConfigured } from './src/utils/supabaseClient';
import { supabaseAdmin } from './supabaseAdmin';

export interface ServerJobPayload {
  jobId: string;
  userId?: string;
  kind: string;
  mode: string;
  text?: string;
  images?: string[]; // base64 or data URLs
  imageUrls?: string[];
  history?: any[];
  userProfile?: any;
  engine?: string;
  biomarkersNeedingImprovement?: any[];
  remainingAllowance?: any;
  activeMeal?: any;
  foodLogs?: any[];
  userSelectedMode?: string;
  activeScoutItems?: any[];
}

export async function submitServerJob(payload: ServerJobPayload): Promise<void> {
  const { jobId, userId = 'anonymous', kind, mode, text, images = [], imageUrls = [] } = payload;

  // 1. Initial status write to Supabase
  if (isSupabaseConfigured) {
    await supabaseAdmin.from('agent_jobs').upsert({
      id: jobId,
      user_id: userId,
      kind,
      mode,
      status: 'running',
      progress_percent: 5,
      status_message: 'Starting cloud food analysis...',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  }

  // 2. Asynchronous cloud execution (fire & forget on server process)
  setImmediate(async () => {
    let lastProgressUpdate = 0;
    const progressThrottleMs = 1500;
    let accumulatedLogs: string[] = [];
    let photoUrl = imageUrls[0] || '';
    let currentProgress = 5;
    let currentStatusMessage = 'Starting cloud food analysis...';

    const updateSupabaseProgress = async (progress: number, message: string) => {
      currentProgress = progress;
      currentStatusMessage = message;
      const now = Date.now();
      if (now - lastProgressUpdate > progressThrottleMs) {
        lastProgressUpdate = now;
        if (isSupabaseConfigured) {
          try {
            await supabaseAdmin.from('agent_jobs').update({
              progress_percent: progress,
              status_message: message,
              photo_url: photoUrl || null,
              updated_at: new Date().toISOString()
            }).eq('id', jobId);
          } catch (e) {
            console.error('[ServerJobs] Failed to update progress:', e);
          }
        }
      }
    };

    try {
      // Step A: Upload photos to Cloudflare R2
      if (!photoUrl && images.length > 0) {
        photoUrl = await uploadPhotoToR2(jobId, images[0]);
      }

      await updateSupabaseProgress(15, 'Vision Scout starting...');

      // Prepare request body for loopback
      const bodyData = {
        message: text || '',
        images: images,
        imageUrls: photoUrl ? [photoUrl] : imageUrls,
        history: payload.history || [],
        userProfile: payload.userProfile || null,
        engine: payload.engine || 'gemini-3.5-flash-lite',
        biomarkersNeedingImprovement: payload.biomarkersNeedingImprovement || [],
        remainingAllowance: payload.remainingAllowance || null,
        activeMeal: payload.activeMeal || null,
        foodLogs: payload.foodLogs || [],
        userSelectedMode: payload.userSelectedMode || mode || 'review',
        activeScoutItems: payload.activeScoutItems || []
      };

      const response = await fetch('http://127.0.0.1:3000/api/gemini/food-analyze?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': 'server-job-' + jobId
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        throw new Error(`Local food-analyze failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body stream is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let finalData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const rawData = trimmed.slice(6);
          if (!rawData) continue;

          try {
            const parsed = JSON.parse(rawData);
            if (parsed.type === 'log') {
              accumulatedLogs.push(`[${parsed.logType || 'info'}] ${parsed.message}`);
              
              if (parsed.logType === 'status') {
                let prog = currentProgress;
                const msg = parsed.message || '';
                if (msg.toLowerCase().includes('scout')) {
                  prog = Math.max(prog, 30);
                } else if (msg.toLowerCase().includes('database') || msg.toLowerCase().includes('usda') || msg.toLowerCase().includes('search')) {
                  prog = Math.max(prog, 50);
                } else if (msg.toLowerCase().includes('dietitian') || msg.toLowerCase().includes('nutritionist')) {
                  prog = Math.max(prog, 70);
                } else if (msg.toLowerCase().includes('final')) {
                  prog = Math.max(prog, 90);
                }
                await updateSupabaseProgress(prog, msg);
              }
            } else if (parsed.final === true && parsed.result) {
              finalData = parsed.result;
            }
          } catch (err) {
            // ignore JSON parse error on incomplete chunks
          }
        }
      }

      if (!finalData) {
        throw new Error('Stream finished but no final result data was received');
      }

      // Step B: Build clean result object
      const pendingFoodLog = finalData.pendingFoodLog || finalData.data || finalData;
      
      if (pendingFoodLog && typeof pendingFoodLog === 'object') {
        pendingFoodLog.imageUrl = photoUrl || pendingFoodLog.imageUrl;
        if (Array.isArray(pendingFoodLog.imageUrls)) {
          pendingFoodLog.imageUrls = photoUrl ? [photoUrl] : pendingFoodLog.imageUrls;
        }
      }

      const cleanResult = {
        pendingFoodLog: pendingFoodLog,
        photoUrl: photoUrl || undefined,
        debugUrl: undefined as string | undefined,
        mode: mode || 'review',
        scoutItems: finalData.scoutItems || undefined
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
        backendLogs: accumulatedLogs.join('\n'),
        completedAt: new Date().toISOString()
      };
      const debugUrl = await uploadDebugPayloadToR2(jobId, debugData);
      cleanResult.debugUrl = debugUrl;

      if (pendingFoodLog && typeof pendingFoodLog === 'object') {
        pendingFoodLog.debugUrl = debugUrl;
      }

      // Step D: Update Supabase to Succeeded
      if (isSupabaseConfigured) {
        await supabaseAdmin.from('agent_jobs').update({
          status: 'succeeded',
          progress_percent: 100,
          status_message: 'Analysis complete',
          photo_url: photoUrl || null,
          debug_url: debugUrl || null,
          clean_result: cleanResult,
          updated_at: new Date().toISOString()
        }).eq('id', jobId);
      }
    } catch (err: any) {
      console.error(`[ServerJobs] Job ${jobId} failed:`, err);
      if (isSupabaseConfigured) {
        try {
          await supabaseAdmin.from('agent_jobs').update({
            status: 'failed',
            status_message: err.message || 'Server analysis failed',
            updated_at: new Date().toISOString()
          }).eq('id', jobId);
        } catch (dbErr) {
          console.error('[ServerJobs] Failed to update failure status in Supabase:', dbErr);
        }
      }
    }
  });
}
