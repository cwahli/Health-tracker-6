import fs from 'fs';

let failed = false;
function assert(condition, msg) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  }
}

// 1. Check App.tsx (V1)
assert(fs.existsSync('src/App.tsx'), 'src/App.tsx does not exist');
if (fs.existsSync('src/App.tsx')) {
  const appSrc = fs.readFileSync('src/App.tsx', 'utf8');
  assert(appSrc.includes("serverJob.status === 'succeeded'"), 'App.tsx missing serverJob succeeded check');
  assert(appSrc.includes('isLive: false'), 'App.tsx missing isLive: false in succeeded assistant message');
  assert(appSrc.includes('withoutLive') || appSrc.includes('userMsgs'), 'App.tsx missing live assistant cleanup or userMsgs selection');
}

// 2. Check serverJobs.ts (V2)
assert(fs.existsSync('serverJobs.ts'), 'serverJobs.ts does not exist');
if (fs.existsSync('serverJobs.ts')) {
  const sjSrc = fs.readFileSync('serverJobs.ts', 'utf8');
  assert(sjSrc.includes('dietitianScratchpad'), 'serverJobs.ts cleanResult missing dietitianScratchpad');
  assert(sjSrc.includes('backendLogs'), 'serverJobs.ts cleanResult missing backendLogs');
}

// 3. Check LogChat.tsx (V3 & V4)
assert(fs.existsSync('src/components/LogChat.tsx'), 'src/components/LogChat.tsx does not exist');
if (fs.existsSync('src/components/LogChat.tsx')) {
  const lcSrc = fs.readFileSync('src/components/LogChat.tsx', 'utf8');
  assert(lcSrc.includes("job.status === 'succeeded'"), 'LogChat.tsx missing succeeded check inside loadJobMessages');
  assert(lcSrc.includes('handleDownloadDebug'), 'LogChat.tsx missing handleDownloadDebug implementation');
  assert(lcSrc.includes('client-fallback'), 'LogChat.tsx missing client-fallback source in debug download payload');
  assert(lcSrc.includes('/api/jobs/debug'), 'LogChat.tsx missing fetch or reference to /api/jobs/debug');
}

// 4. Check server.ts (V4)
assert(fs.existsSync('server.ts'), 'server.ts does not exist');
if (fs.existsSync('server.ts')) {
  const serverSrc = fs.readFileSync('server.ts', 'utf8');
  assert(serverSrc.includes('/api/jobs/debug'), 'server.ts missing /api/jobs/debug endpoint');
}

if (failed) {
  console.error('Some result-ux-debug assertions failed.');
  process.exit(1);
} else {
  console.log('PASS assert-result-ux-debug!');
  process.exit(0);
}
