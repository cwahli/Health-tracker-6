const fs = require('fs');

let content = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');

const target = `
    try {
      await this.executor(job, controller.signal);
      
      JobStore.updateJob(job.id, {
        status: 'succeeded',
        finishedAt: new Date().toISOString(),
        progressPercent: 100,
        retryNotBefore: undefined,
      });

      this.consecutiveFailures = 0;

      // Hybrid Cloud Storage (R3): Upload photo and debug payload to Cloudflare R2 & upsert clean result to Supabase
      const updatedJob = JobStore.getJob(job.id) || job;
      let photoUrl: string | undefined = updatedJob.result?.photoUrl;
      let debugUrl: string | undefined = updatedJob.result?.debugUrl;

      try {
        const images = await ImageStore.getImages(job.id);
        if (images && images.length > 0) {
          const firstImg = typeof images[0] === 'string' ? images[0] : '';
          if (firstImg) {
            photoUrl = await uploadPhotoToR2(job.id, firstImg);
          }
        }

        if (updatedJob.result) {
          const debugData = {
            jobId: job.id,
            liveThoughts: updatedJob.liveThoughts,
            statusMessage: updatedJob.statusMessage,
            messages: updatedJob.messages,
            result: updatedJob.result,
          };
          debugUrl = await uploadDebugPayloadToR2(job.id, debugData);
        }

        let strippedResult = undefined;
        if (updatedJob.result) {
          strippedResult = { ...updatedJob.result };
          if (strippedResult.raw) delete strippedResult.raw;
          if (strippedResult.data?.raw) delete strippedResult.data.raw;
        }

        const cleanResult = strippedResult ? {
          ...strippedResult,
          photoUrl: photoUrl || strippedResult.photoUrl,
          debugUrl: debugUrl || strippedResult.debugUrl,
        } : undefined;

        if (cleanResult) {
          JobStore.updateJob(job.id, {
            result: cleanResult,
          });
        }
        await upsertJobToSupabase(updatedJob, auth.currentUser?.uid || 'anonymous', photoUrl, debugUrl, cleanResult);
      } catch (r3Err) {
        console.warn('[JobQueueRunner] R3 hybrid storage post-processing warning:', r3Err);
      }
    } catch (error: any) {
`;

const replacement = `
    try {
      // PRE-UPLOAD IMAGE TO R2 for kill-proof backend processing
      let photoUrl: string | undefined = job.photoUrl;
      try {
        const images = await ImageStore.getImages(job.id);
        if (images && images.length > 0) {
          const firstImg = typeof images[0] === 'string' ? images[0] : '';
          if (firstImg) {
            JobStore.updateJob(job.id, { statusMessage: 'Uploading image to R2...' });
            photoUrl = await uploadPhotoToR2(job.id, firstImg);
            JobStore.updateJob(job.id, { photoUrl });
            job.photoUrl = photoUrl;
          }
        }
      } catch (err) {
        console.warn('[JobQueueRunner] R2 pre-upload failed:', err);
      }

      await this.executor(job, controller.signal);
      
      JobStore.updateJob(job.id, {
        status: 'succeeded',
        finishedAt: new Date().toISOString(),
        progressPercent: 100,
        retryNotBefore: undefined,
      });

      this.consecutiveFailures = 0;

      // Post-processing: Upload debug payload & upsert final result to Supabase
      const updatedJob = JobStore.getJob(job.id) || job;
      let debugUrl: string | undefined = updatedJob.result?.debugUrl;

      try {
        if (updatedJob.result) {
          const debugData = {
            jobId: job.id,
            liveThoughts: updatedJob.liveThoughts,
            statusMessage: updatedJob.statusMessage,
            messages: updatedJob.messages,
            result: updatedJob.result,
          };
          debugUrl = await uploadDebugPayloadToR2(job.id, debugData);
        }

        let strippedResult = undefined;
        if (updatedJob.result) {
          strippedResult = { ...updatedJob.result };
          if (strippedResult.raw) delete strippedResult.raw;
          if (strippedResult.data?.raw) delete strippedResult.data.raw;
        }

        const cleanResult = strippedResult ? {
          ...strippedResult,
          photoUrl: photoUrl || strippedResult.photoUrl,
          debugUrl: debugUrl || strippedResult.debugUrl,
        } : undefined;

        if (cleanResult) {
          JobStore.updateJob(job.id, {
            result: cleanResult,
          });
        }
        await upsertJobToSupabase(updatedJob, auth.currentUser?.uid || 'anonymous', photoUrl, debugUrl, cleanResult);
      } catch (r3Err) {
        console.warn('[JobQueueRunner] R3 hybrid storage post-processing warning:', r3Err);
      }
    } catch (error: any) {
`;

content = content.replace(target, replacement);
fs.writeFileSync('src/jobs/JobQueueRunner.ts', content);
console.log('Patched JobQueueRunner.ts');
