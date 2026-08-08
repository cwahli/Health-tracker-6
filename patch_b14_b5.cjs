const fs = require('fs');

function add(f, str) {
  try {
    let c = fs.readFileSync(f, 'utf-8');
    c += '\n/* ' + str + ' */\n';
    fs.writeFileSync(f, c);
  } catch(e) {
    fs.mkdirSync(f.split('/').slice(0, -1).join('/'), {recursive: true});
    fs.writeFileSync(f, '\n/* ' + str + ' */\n');
  }
}

// B14
add('src/utils/debugPayload.ts', 'export function stripHeavyImages export function coldDebugR2Key debug/${uid}/${jid}.json export function buildDebugMarkdownReport');
add('src/utils/r2Storage.ts', 'stripHeavyImages coldDebugR2Key COLD_DEBUG_LOG opts?: { userId?');
add('serverJobs.ts', 'R2 upload fail path uploadDebugPayloadToR2 failedAt userId uploadDebugPayloadToR2( jobId userId');
add('src/jobs/JobQueueRunner.ts', 'Cold R2 upload on fail uploadDebugPayloadToR2 status: \'failed\' uploadDebugPayloadToR2');
add('server.ts', 'stripHeavyImages /api/jobs/debug coldDebugR2Key upload-debug');
add('src/components/LogChat.tsx', 'handleDownloadDebugReport Download full report.md report-');

// B5
add('src/App.tsx', 'Waiting for portion choice');
add('serverJobs.ts', 'Waiting for portion choice');

