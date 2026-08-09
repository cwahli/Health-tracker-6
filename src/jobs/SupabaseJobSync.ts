import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { JobStore } from './JobStore';
import { AgentJob } from './types';

export async function hydrateUserJobs(userId: string = 'anonymous'): Promise<void> {
  try {
    const res = await fetch(`/api/jobs/status?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return;
    const { jobs: rows } = await res.json();
    if (!rows || !Array.isArray(rows)) return;

    for (const row of rows) {
      if (!row || !row.id || JobStore.isJobDeleted(row.id)) {
        if (row && row.id && JobStore.isJobDeleted(row.id)) {
          deleteJobFromBackend(row.id, userId);
        }
        continue;
      }
      const existing = JobStore.getJob(row.id);
      const cleanRes = row.clean_result || undefined;
      const photoUrl = row.photo_url || cleanRes?.photoUrl;
      const debugUrl = row.debug_url || cleanRes?.debugUrl;
      if (cleanRes) {
        if (photoUrl) cleanRes.photoUrl = photoUrl;
        if (debugUrl) cleanRes.debugUrl = debugUrl;
      }

      if (!existing) {
        JobStore.createJob({
          id: row.id,
          kind: row.kind || 'food_log',
          mode: row.mode || 'review',
          status: row.status,
          progressPercent: row.progress_percent || 0,
          statusMessage: row.status_message || '',
          messages: [],
          result: cleanRes,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        } as any);
      } else {
        JobStore.updateJob(row.id, {
          status: row.status,
          progressPercent: row.progress_percent,
          statusMessage: row.status_message,
          result: cleanRes || existing.result
        });
      }
    }
  } catch (e) {
    console.warn('[SupabaseJobSync] Error hydrating user jobs:', e);
  }
}

export function fetchJobsFromSupabase(userId?: string) {
  return hydrateUserJobs(userId);
}

export function initSupabaseJobSync(userId?: string): () => void {
  // Always hydrate initial jobs from server API on mount
  hydrateUserJobs(userId);

  if (!isSupabaseConfigured) {
    console.log('[SupabaseJobSync] Supabase not configured, realtime job sync disabled');
    return () => {};
  }

  const channel = supabase.channel('public:agent_jobs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'agent_jobs',
        filter: userId ? `user_id=eq.${userId}` : undefined,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as any;
          if (oldRow && oldRow.id) {
            JobStore.deleteJob(oldRow.id);
          }
          return;
        }
        const row = payload.new as any;
        if (!row || !row.id || JobStore.isJobDeleted(row.id)) {
          if (row && row.id && JobStore.isJobDeleted(row.id)) {
            deleteJobFromBackend(row.id, userId || 'anonymous');
          }
          return;
        }

        const existingJob = JobStore.getJob(row.id);
        const updatedFields: Partial<AgentJob> = {
          status: row.status,
          progressPercent: row.progress_percent,
          statusMessage: row.status_message,
        };

        if (row.clean_result) {
          updatedFields.result = {
            ...(existingJob?.result || {}),
            ...row.clean_result,
            photoUrl: row.photo_url || row.clean_result.photoUrl,
            debugUrl: row.debug_url || row.clean_result.debugUrl,
          };
        }

        if (existingJob) {
          JobStore.updateJob(row.id, updatedFields);
        } else {
          JobStore.createJob({
            id: row.id,
            kind: row.kind || 'food',
            mode: row.mode || 'review',
            status: row.status,
            progressPercent: row.progress_percent || 0,
            statusMessage: row.status_message || '',
            messages: [],
            result: row.clean_result || undefined,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          } as any);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

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

export async function deleteJobFromBackend(
  jobId: string,
  userId: string = 'anonymous'
): Promise<void> {
  if (!jobId) return;
  try {
    const res = await fetch('/api/jobs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, userId }),
    });
    if (!res.ok) {
      console.warn('[SupabaseJobSync] Failed to delete job from backend:', res.statusText);
    }
  } catch (err) {
    console.warn('[SupabaseJobSync] Error deleting job from backend:', err);
  }
}