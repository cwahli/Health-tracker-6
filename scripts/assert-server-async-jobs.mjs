import fs from 'fs';

let failed = false;
function assert(condition, msg) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  }
}

// 1. Check serverJobs.ts
assert(fs.existsSync('serverJobs.ts'), 'serverJobs.ts does not exist');
if (fs.existsSync('serverJobs.ts')) {
  const serverJobsSrc = fs.readFileSync('serverJobs.ts', 'utf8');
  assert(serverJobsSrc.includes('submitServerJob'), 'serverJobs.ts missing submitServerJob');
  assert(serverJobsSrc.includes('uploadPhotoToR2'), 'serverJobs.ts missing uploadPhotoToR2');
  assert(serverJobsSrc.includes('uploadDebugPayloadToR2'), 'serverJobs.ts missing uploadDebugPayloadToR2');
  assert(serverJobsSrc.includes('isSupabaseConfigured'), 'serverJobs.ts missing isSupabaseConfigured');
}

// 2. Check server.ts
assert(fs.existsSync('server.ts'), 'server.ts does not exist');
if (fs.existsSync('server.ts')) {
  const serverSrc = fs.readFileSync('server.ts', 'utf8');
  assert(serverSrc.includes('/api/jobs/submit'), 'server.ts missing /api/jobs/submit endpoint');
  assert(serverSrc.includes('/api/jobs/status'), 'server.ts missing /api/jobs/status endpoint');
  assert(serverSrc.includes('submitServerJob'), 'server.ts missing submitServerJob integration/import');
}

// 3. Check SupabaseJobSync.ts
assert(fs.existsSync('src/jobs/SupabaseJobSync.ts'), 'SupabaseJobSync.ts does not exist');
if (fs.existsSync('src/jobs/SupabaseJobSync.ts')) {
  const syncSrc = fs.readFileSync('src/jobs/SupabaseJobSync.ts', 'utf8');
  assert(syncSrc.includes('hydrateUserJobs'), 'SupabaseJobSync.ts missing hydrateUserJobs');
  assert(syncSrc.includes('fetchJobsFromSupabase'), 'SupabaseJobSync.ts missing fetchJobsFromSupabase');
}

if (failed) {
  console.error('Some assertions failed.');
  process.exit(1);
} else {
  console.log('PASS assert-server-async-jobs');
  process.exit(0);
}
