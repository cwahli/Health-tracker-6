import fs from 'fs';

console.log('[assert-remaining-delta] Running R1-R5 delta assertions...');

// R1: server.ts submit route forwards full body / history
const serverCode = fs.readFileSync('server.ts', 'utf8');
const submitIndex = serverCode.indexOf("/api/jobs/submit");
const submitChunk = serverCode.slice(submitIndex, submitIndex + 900);
if (!/history|userProfile|req\.body/.test(submitChunk)) {
  console.error('FAIL R1: /api/jobs/submit route drops history/userProfile payload');
  process.exit(1);
}

// R2: JobQueueRunner skips debug upload & upsert for server-owned jobs
const runnerCode = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');
if (!/isServerOwned/.test(runnerCode)) {
  console.error('FAIL R2: JobQueueRunner missing isServerOwned check');
  process.exit(1);
}
const earlyReturn = /if\s*\(\s*isServerOwned\s*\)\s*\{?[\s\S]{0,120}return/.test(runnerCode);
if (!earlyReturn) {
  console.error('FAIL R2: JobQueueRunner does not return early on isServerOwned');
  process.exit(1);
}

// R3: SupabaseJobSync hydrate fetches from /api/jobs/status or /api/jobs
const syncCode = fs.readFileSync('src/jobs/SupabaseJobSync.ts', 'utf8');
if (!/\/api\/jobs\/status|\/api\/jobs/.test(syncCode)) {
  console.error('FAIL R3: SupabaseJobSync hydrate does not use server status API');
  process.exit(1);
}

// R4: Status route in server.ts checks/filters by userId AND App poll site passes userId
const statusIndex = serverCode.indexOf("/api/jobs/status");
const statusChunk = serverCode.slice(statusIndex, statusIndex + 700);
if (!/userId|user_id/.test(statusChunk)) {
  console.error('FAIL R4: /api/jobs/status route does not filter by userId');
  process.exit(1);
}

const appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!/jobs\/status\?[^'"]*userId|jobs\/status.*userId/.test(appCode)) {
  console.error('FAIL R4: App.tsx status poll site does not pass userId');
  process.exit(1);
}

console.log('PASS assert-remaining-delta!');
