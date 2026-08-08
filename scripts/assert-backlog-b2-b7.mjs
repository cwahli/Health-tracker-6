/**
 * Gates for backlog slice: B2 job durability hooks + B7 skip resolver on complete label.
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
const jobs = fs.readFileSync(path.join(root, 'serverJobs.ts'), 'utf-8');
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8');
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const logs = fs.readFileSync(path.join(root, 'src/utils/agentLogsTracker.ts'), 'utf-8');

// B2a — recover success when finalData present after error
check(
  'B2 recover-as-success when finalData present',
  jobs.includes('Recovering: final result was present') && jobs.includes('persistSucceeded')
);

// B2b — R2 failure non-fatal on success path
check(
  'B2 R2 debug upload non-fatal',
  jobs.includes('R2 debug upload failed (non-fatal)') || jobs.includes('R2 debug upload failed (job still succeeds)')
);

// B2c — fail path uploads debug + keeps clean_result with backendLogs
check(
  'B2 fail path keeps backendLogs and tries R2',
  jobs.includes('R2 debug upload on fail') && jobs.includes('backendLogs:')
);

// B2d — client failed job keeps assistant message + logs
check(
  'B2 client failed job keeps assistant bubble with backendLogs',
  app.includes('msg_assistant_fail_') && app.includes('Partial result was preserved')
);

// B2e — timeout last-chance poll for late success
check(
  'B2 timeout last-chance poll recovers succeeded job',
  app.includes('recovered after poll window') || app.includes('Analysis complete (recovered after poll window)')
);

// B2f — timeout saves live logs into agent request log
check(
  'B2 timeout saves liveThoughts backendLogs when present',
  app.includes('liveThoughts?.backendLogs') && app.includes('msg_assistant_timeout_')
);

// B7 — skip food resolver when printed label complete
check(
  'B7 Food Resolver Skip on complete printed label',
  server.includes('[Food Resolver Skip] Complete printed label covers') &&
    server.includes('scoutHasCompletePrintedLabel') &&
    server.includes('labelCompleteQueries')
);

// B14 hot ring 3–5
check(
  'B14 hot log cap is 5 (not 15)',
  /HOT_LOG_CAP\s*=\s*5/.test(logs) && !logs.includes('if (existing.length > 15)')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
