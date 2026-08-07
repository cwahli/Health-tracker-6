import fs from 'fs';

console.log('[assert-remaining-smoke] Running S1-S3 smoke assertions...');

// S1: FoodHistoryTab filter handles server hydrated jobs (pendingFoodLog, photoUrl, or active server job status)
const fh = fs.readFileSync('src/components/FoodHistoryTab.tsx', 'utf8');
if (!/pendingFoodLog|photoUrl|food_log/.test(fh)) {
  console.error('FAIL S1: FoodHistoryTab missing server job filter signals');
  process.exit(1);
}

// S2: SupabaseJobSync calls hydrateUserJobs unconditionally before checking isSupabaseConfigured
const sync = fs.readFileSync('src/jobs/SupabaseJobSync.ts', 'utf8');
const init = sync.slice(sync.indexOf('initSupabaseJobSync'));
const idx = init.indexOf('isSupabaseConfigured');
const hyd = init.indexOf('hydrateUserJobs');
if (idx >= 0 && hyd > idx) {
  const between = init.slice(idx, hyd);
  if (/return\s*\(\s*\)\s*=>\s*\{\s*\}/.test(between)) {
    console.error('FAIL S2: early return on !isSupabaseConfigured skips hydrateUserJobs');
    process.exit(1);
  }
}

// S3: server.ts /api/jobs/status requires userId parameter
const st = fs.readFileSync('server.ts', 'utf8');
const statusIdx = st.indexOf("/api/jobs/status");
const statusChunk = st.slice(statusIdx, statusIdx + 650);
if (!/if\s*\(\s*!userId|!.*userId/.test(statusChunk) || !/user_id/.test(statusChunk)) {
  console.error('FAIL S3: /api/jobs/status does not require userId or filter by user_id');
  process.exit(1);
}

console.log('PASS assert-remaining-smoke!');
