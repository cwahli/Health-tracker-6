import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('Running assert-unified-modal-r3...');

// 1. Check r2Storage.ts
const r2Path = path.resolve('src/utils/r2Storage.ts');
assert(fs.existsSync(r2Path), 'src/utils/r2Storage.ts must exist');
const r2Code = fs.readFileSync(r2Path, 'utf8');
assert(r2Code.includes('S3Client'), 'r2Storage.ts must reference S3Client');
assert(
  r2Code.includes('d17eecca64f82625d29dc38b14f46c14.r2.cloudflarestorage.com'),
  'r2Storage.ts must reference endpoint d17eecca64f82625d29dc38b14f46c14.r2.cloudflarestorage.com'
);
assert(r2Code.includes('uploadPhotoToR2'), 'r2Storage.ts must export uploadPhotoToR2');
assert(r2Code.includes('uploadDebugPayloadToR2'), 'r2Storage.ts must export uploadDebugPayloadToR2');

// 2. Check SupabaseJobSync.ts
const syncPath = path.resolve('src/jobs/SupabaseJobSync.ts');
assert(fs.existsSync(syncPath), 'src/jobs/SupabaseJobSync.ts must exist');
const syncCode = fs.readFileSync(syncPath, 'utf8');
assert(syncCode.includes('supabase.channel'), 'SupabaseJobSync.ts must reference supabase.channel');

// 3. Check JobQueueRunner.ts
const runnerPath = path.resolve('src/jobs/JobQueueRunner.ts');
assert(fs.existsSync(runnerPath), 'src/jobs/JobQueueRunner.ts must exist');
const runnerCode = fs.readFileSync(runnerPath, 'utf8');
assert(
  runnerCode.includes('uploadPhotoToR2') || runnerCode.includes('uploadDebugPayloadToR2'),
  'JobQueueRunner.ts must call R2 upload helpers'
);

// 4. Check migration file
const migrationPath = path.resolve('supabase/migrations/20260806_agent_jobs.sql');
assert(fs.existsSync(migrationPath), 'supabase/migrations/20260806_agent_jobs.sql must exist');

console.log('PASS assert-unified-modal-r3');
