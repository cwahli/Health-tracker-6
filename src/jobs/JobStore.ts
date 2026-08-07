import { AgentJob } from './types';
import { ImageStore } from './ImageStore';

type Listener = () => void;

function serializeJobs(jobs: AgentJob[]): string {
  return JSON.stringify(jobs, (key, value) => {
    if (key === 'abortController') return undefined;
    if (typeof value === 'string' && (value.startsWith('data:image/') || (value.length > 50000 && value.includes('base64')))) {
      return 'Image reference preserved';
    }
    return value;
  });
}

class JobStoreImpl {
  private jobs: Map<string, AgentJob> = new Map();
  private listeners: Set<Listener> = new Set();
  private maxQueued = 5;

  constructor() {
    this.loadJobs();
    // Cleanup orphaned images from past sessions (Phase 3 TTL)
    setTimeout(() => {
      this.cleanupOldJobs();
    }, 1000);
  }

  private loadJobs() {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem('jobstore_jobs');
      if (stored) {
        const parsed = JSON.parse(stored) as AgentJob[];
        for (const job of parsed) {
          delete job.abortController;
          if (job.status === 'running') {
            job.status = 'cancelled';
            job.finishedAt = new Date().toISOString();
            job.cancelReason = 'Analysis interrupted by browser reload';
          }
          this.jobs.set(job.id, job);
        }
      }
    } catch (e) {
      console.warn('Error loading jobs from localStorage:', e);
    }
  }

  private saveJobs() {
    try {
      if (typeof localStorage === 'undefined') return;
      const allJobs = Array.from(this.jobs.values());
      let json = serializeJobs(allJobs);

      try {
        localStorage.setItem('jobstore_jobs', json);
        return;
      } catch (quotaError) {
        console.warn('localStorage quota exceeded while saving jobs. Pruning old jobs to free up quota...');

        // Separate active vs completed jobs
        const activeJobs = allJobs.filter(j => j.status === 'queued' || j.status === 'running' || j.status === 'draft');
        const finishedJobs = allJobs
          .filter(j => j.status === 'succeeded' || j.status === 'failed' || j.status === 'cancelled')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Keep at most 5 most recent finished jobs when quota is tight
        const keptFinished = finishedJobs.slice(0, 5);
        const keptJobs = [...activeJobs, ...keptFinished];

        // Purge pruned jobs from in-memory map and ImageStore
        const keptIds = new Set(keptJobs.map(j => j.id));
        for (const [id] of this.jobs) {
          if (!keptIds.has(id)) {
            this.jobs.delete(id);
            ImageStore.purgeImages(id).catch(() => {});
          }
        }

        json = serializeJobs(keptJobs);
        localStorage.setItem('jobstore_jobs', json);
      }
    } catch (e) {
      console.warn('Error saving jobs to localStorage:', e);
    }
  }

  private async cleanupOldJobs() {
    const now = Date.now();
    const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours for succeeded jobs
    const failedMaxAgeMs = 2 * 60 * 60 * 1000; // 2 hours for failed/cancelled jobs
    const finishedJobs: AgentJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled') {
        finishedJobs.push(job);
      }
    }

    // Sort by createdAt descending
    finishedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const jobsToDelete: string[] = [];

    // Delete jobs older than 24 hours OR beyond the 15 most recent finished jobs
    finishedJobs.forEach((job, index) => {
      const createdAtTime = new Date(job.createdAt).getTime();
      const isFailed = job.status === 'failed' || job.status === 'cancelled';
      const isExpired = now - createdAtTime > (isFailed ? failedMaxAgeMs : maxAgeMs);
      const isExcess = index >= 15;
      if (isExpired || isExcess) {
        jobsToDelete.push(job.id);
      }
    });

    for (const id of jobsToDelete) {
      this.jobs.delete(id);
      await ImageStore.purgeImages(id);
    }

    if (jobsToDelete.length > 0) {
      this.saveJobs();
      this.notify();
    }

    // Also purge orphaned images from ImageStore older than 24 hours
    await ImageStore.purgeAllOldImages(maxAgeMs);
  }

  createJob(params: Partial<AgentJob> & { id: string }): AgentJob {
    const job: AgentJob = {
      kind: 'food_log',
      status: 'draft',
      stepIndex: 0,
      stepTotal: 1,
      progressPercent: 0,
      messages: [],
      inputSnapshot: { text: '', imageRefs: [] },
      attemptByStep: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...params,
      id: params.id,
    };
    this.jobs.set(job.id, job);
    this.saveJobs();
    this.notify();
    return job;
  }

  updateJob(id: string, patch: Partial<AgentJob>) {
    const job = this.jobs.get(id);
    if (!job) return;

    if (patch.status === 'queued') {
      const queuedCount = this.getQueue().length;
      if (job.status !== 'queued' && queuedCount >= this.maxQueued) {
        throw new Error('maxQueued limit reached');
      }
    }

    Object.assign(job, { ...patch, updatedAt: new Date().toISOString() });
    this.saveJobs();
    this.notify();
  }

  async deleteJob(id: string) {
    if (this.jobs.has(id)) {
      this.jobs.delete(id);
      this.saveJobs();
      this.notify();
    }
    // Draft cleanup auto-purges associated ImageStore entries
    await ImageStore.purgeImages(id);
  }

  getJob(id: string): AgentJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): AgentJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  getQueue(): AgentJob[] {
    return this.getAllJobs().filter((j) => j.status === 'queued');
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const JobStore = new JobStoreImpl();
