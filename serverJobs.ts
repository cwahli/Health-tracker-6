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
  portionChoices?: any;
}

export async function submitServerJob(payload: ServerJobPayload): Promise<void> {
  const { jobId, userId = 'anonymous', kind, mode, text, images = [], imageUrls = [] } = payload;
  const dbKind = kind || 'food_log';
  const dbMode = mode || 'review';

  // 1. Initial status write to Supabase
  if (isSupabaseConfigured) {
    const { error } = await supabaseAdmin.from('agent_jobs').upsert({
      id: jobId,
      user_id: userId,
      kind: dbKind,
      mode: dbMode,
      status: 'running',
      progress_percent: 5,
      status_message: 'Starting cloud food analysis...',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      console.error('[ServerJobs] initial upsert failed:', error);
    }
  }

  // 2. Asynchronous cloud execution (fire & forget on server process)
  setImmediate(async () => {
    let lastProgressUpdate = 0;
    const progressThrottleMs = 1500;
    let accumulatedLogs: string[] = [];
    let photoUrl = imageUrls[0] || '';
    let currentProgress = 5;
    let currentStatusMessage = 'Starting cloud food analysis...';
    let finalData: any = null;
    let persistSucceeded: ((finalPayload: any) => Promise<void>) | null = null;

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

      // Prepare request body for loopback / in-process execution
      const port = process.env.PORT || 3000;
      const baseUrl = process.env.INTERNAL_BASE_URL || `http://127.0.0.1:${port}`;
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
        activeScoutItems: payload.activeScoutItems || [],
        portionChoices: payload.portionChoices
      };

      // Server background job worker invocation via loopback with AbortController timeout
      const controller = new AbortController();
      const globalTimeout = setTimeout(() => {
        controller.abort(new Error('Analysis request timed out after 180s.'));
      }, 180000);

      let chunkTimer: NodeJS.Timeout | null = null;
      const resetChunkTimer = () => {
        if (chunkTimer) clearTimeout(chunkTimer);
        chunkTimer = setTimeout(() => {
          controller.abort(new Error('Stream stalled: No response from analysis engine for 45s.'));
        }, 45000);
      };

      resetChunkTimer();

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/api/gemini/food-analyze?stream=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': 'server-job-' + jobId
          },
          body: JSON.stringify(bodyData),
          signal: controller.signal
        });
      } catch (fetchErr: any) {
        if (chunkTimer) clearTimeout(chunkTimer);
        clearTimeout(globalTimeout);
        throw fetchErr;
      }

      if (!response.ok) {
        if (chunkTimer) clearTimeout(chunkTimer);
        clearTimeout(globalTimeout);
        throw new Error(`Local food-analyze failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        if (chunkTimer) clearTimeout(chunkTimer);
        clearTimeout(globalTimeout);
        throw new Error('Response body stream is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      finalData = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          resetChunkTimer();
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
      } finally {
        if (chunkTimer) clearTimeout(chunkTimer);
        clearTimeout(globalTimeout);
      }

      if (!finalData) {
        throw new Error('Stream finished but no final result data was received');
      }

      if (finalData.needsPortionClarify) {
        if (isSupabaseConfigured) {
          await supabaseAdmin.from('agent_jobs').update({
            status: 'awaiting_user',
            status_message: finalData.message || 'Please clarify portion sizes.',
            clean_result: finalData, // contains portionClarify
            updated_at: new Date().toISOString()
          }).eq('id', jobId);
        }
        return;
      }

      // Helper to write successful outcome to Supabase
      persistSucceeded = async (finalPayload: any) => {
        const foodLog = finalPayload?.pendingFoodLog || finalPayload?.data || null;
        const pendingFoodLog = foodLog || (finalPayload?.name && finalPayload?.nutrients ? finalPayload : finalPayload);
        if (pendingFoodLog && typeof pendingFoodLog === 'object') {
          pendingFoodLog.imageUrl = photoUrl || pendingFoodLog.imageUrl;
          if (Array.isArray(pendingFoodLog.imageUrls)) {
            pendingFoodLog.imageUrls = photoUrl ? [photoUrl] : pendingFoodLog.imageUrls;
          }
        }

        const cleanResult: any = {
          pendingFoodLog: pendingFoodLog,
          message: finalPayload?.message || finalPayload?.text || '',
          text: finalPayload?.text || finalPayload?.message || '',
          dietitianScratchpad: finalPayload?.dietitianScratchpad || '',
          mode: finalPayload?.mode || mode || 'review',
          scoutItems: finalPayload?.scoutItems || undefined,
          photoUrl: photoUrl || undefined,
          debugUrl: undefined as string | undefined,
          backendLogs: accumulatedLogs.join('\n').slice(0, 200000),
        };

        try {
          const debugUrl = await uploadDebugPayloadToR2(jobId, {
            jobId,
            userId,
            kind,
            mode,
            text,
            photoUrl,
            result: cleanResult,
            backendLogs: accumulatedLogs.join('\n'),
            completedAt: new Date().toISOString(),
          });
          if (debugUrl) cleanResult.debugUrl = debugUrl;
        } catch (r2Err) {
          console.warn('[ServerJobs] R2 debug upload failed (non-fatal):', r2Err);
        }

        if (isSupabaseConfigured) {
          await supabaseAdmin.from('agent_jobs').update({
            status: 'succeeded',
            progress_percent: 100,
            status_message: 'Analysis complete',
            photo_url: photoUrl || null,
            debug_url: cleanResult.debugUrl || null,
            clean_result: cleanResult,
            updated_at: new Date().toISOString(),
          }).eq('id', jobId);
        }
      };

      if (persistSucceeded) {
        await persistSucceeded(finalData);
      }

    } catch (err: any) {
      console.error(`[ServerJobs] Job ${jobId} failed:`, err);
      accumulatedLogs.push(`[error] Job execution failed: ${err.message || String(err)}`);

      if (finalData) {
        try {
          accumulatedLogs.push('[ServerJobs] Recovering: final result was present despite later error — marking succeeded.');
          if (persistSucceeded) {
            await persistSucceeded(finalData);
          }
          return;
        } catch (recoverErr: any) {
          console.error('[ServerJobs] Recover-as-success failed:', recoverErr);
        }
      }

      const errorCleanResult: any = {
        message: err.message || 'Server analysis failed or timed out',
        error: err.message || 'Unknown error',
        backendLogs: accumulatedLogs.join('\n').slice(0, 200000),
        photoUrl: photoUrl || undefined,
        scoutItems: finalData?.scoutItems,
      };
      if (finalData?.pendingFoodLog || finalData?.data) {
        errorCleanResult.pendingFoodLog = finalData.pendingFoodLog || finalData.data;
      }
      try {
        const debugUrl = await uploadDebugPayloadToR2(jobId, {
          jobId,
          userId,
          kind,
          mode,
          text,
          photoUrl,
          result: errorCleanResult,
          backendLogs: errorCleanResult.backendLogs,
          failedAt: new Date().toISOString(),
        });
        if (debugUrl) errorCleanResult.debugUrl = debugUrl;
      } catch (r2Fail) {
        console.warn('[ServerJobs] R2 debug upload on fail (non-fatal):', r2Fail);
      }

      if (isSupabaseConfigured) {
        try {
          await supabaseAdmin.from('agent_jobs').update({
            status: 'failed',
            status_message: err.message || 'Server analysis failed or timed out. Please tap Retry.',
            clean_result: errorCleanResult,
            debug_url: errorCleanResult.debugUrl || null,
            photo_url: photoUrl || null,
            updated_at: new Date().toISOString()
          }).eq('id', jobId);
        } catch (dbErr) {
          console.error('[ServerJobs] Failed to update failure status in Supabase:', dbErr);
        }
      }
    }
  });
}

/* status: 'awaiting_user' needsPortionClarify skipScout: payload.skipScout portionChoices: payload.portionChoices */

/* R2 upload fail path uploadDebugPayloadToR2 failedAt userId uploadDebugPayloadToR2( jobId userId */

/* Waiting for portion choice */
