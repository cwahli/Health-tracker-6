/**
 * Gate: Pass 4 — B14 cold R2 on fail + strip + user key; B9b markdown report.
 */
import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function check(desc, cond) {
  if (cond) {
    console.log(`PASS: ${desc}`);
    pass++;
  } else {
    console.error(`FAIL: ${desc}`);
    fail++;
  }
}

const root = process.cwd();
const debug = fs.readFileSync(path.join(root, 'src/utils/debugPayload.ts'), 'utf-8');
const r2 = fs.readFileSync(path.join(root, 'src/utils/r2Storage.ts'), 'utf-8');
const jobs = fs.readFileSync(path.join(root, 'serverJobs.ts'), 'utf-8');
const runner = fs.readFileSync(path.join(root, 'src/jobs/JobQueueRunner.ts'), 'utf-8');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const logChat = fs.readFileSync(path.join(root, 'src/components/LogChat.tsx'), 'utf-8');

check(
  'B14 stripHeavyImages + coldDebugR2Key user-scoped',
  debug.includes('export function stripHeavyImages') &&
    debug.includes('export function coldDebugR2Key') &&
    debug.includes('debug/${uid}/${jid}.json')
);

check(
  'B14 r2Storage strips + userId opts + COLD_DEBUG_LOG',
  r2.includes('stripHeavyImages') &&
    r2.includes('coldDebugR2Key') &&
    r2.includes('COLD_DEBUG_LOG') &&
    r2.includes('opts?: { userId?')
);

check(
  'B14 serverJobs fail path cold R2 with userId',
  jobs.includes('R2 upload fail path') &&
    jobs.includes('uploadDebugPayloadToR2') &&
    /failedAt[\s\S]{0,200}userId|uploadDebugPayloadToR2\(\s*jobId[\s\S]{0,400}userId/.test(jobs)
);

check(
  'B14 JobQueueRunner cold upload on client fail',
  runner.includes('Cold R2 upload on fail') &&
    runner.includes('uploadDebugPayloadToR2') &&
    /status:\s*'failed'[\s\S]{0,800}uploadDebugPayloadToR2/.test(runner)
);

check(
  'B9c server /api/jobs/debug strips heavy images',
  server.includes('stripHeavyImages') &&
    server.includes('/api/jobs/debug')
);

check(
  'B9b buildDebugMarkdownReport + Download full report.md',
  debug.includes('export function buildDebugMarkdownReport') &&
    logChat.includes('handleDownloadDebugReport') &&
    logChat.includes('Download full report.md') &&
    logChat.includes('report-')
);

check(
  'B14 api/r2/upload-debug uses coldDebugR2Key',
  server.includes('coldDebugR2Key') && server.includes('upload-debug')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
