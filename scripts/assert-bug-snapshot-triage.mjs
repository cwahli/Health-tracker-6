/**
 * Gate: Initiative K — bug snapshot + identified problems + triage + brief API
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
const read = (p) => fs.readFileSync(path.join(root, p), 'utf-8');

const util = read('src/utils/bugSnapshot.ts');
const serverBug = read('serverBugSnapshot.ts');
const server = read('server.ts');
const backlog = read('serverIssueBacklog.ts');
const fab = read('src/components/BugSnapshotFab.tsx');
const tracker = read('src/components/BugTrackerModal.tsx');
const flag = read('src/components/FlagIssueModal.tsx');
const header = read('src/components/Header.tsx');
const mig = read('supabase/migrations/20260808_issue_tags_identified_problems.sql');

check(
  'BT1 R2 key helpers under bugs/',
  util.includes("bugs/${") || util.includes('bugs/') &&
    util.includes('export function bugTagR2Prefix') &&
    util.includes('export function bugShotKey') &&
    util.includes('BUG_SNAPSHOT_MAX_SHOTS')
);

check(
  'BT1 cleanBugLogText + budgetPayloadForDigest + triage prompts',
  util.includes('export function cleanBugLogText') &&
    util.includes('export function budgetPayloadForDigest') &&
    util.includes('export function buildBugTriageSystemPrompt') &&
    util.includes('Suspected layer')
);

check(
  'BT1 settings kill-switch keys',
  util.includes('BUG_SNAPSHOT_SETTINGS_KEY') &&
    util.includes('export function isBugSnapshotEnabled') &&
    util.includes('export function setBugSnapshotEnabled')
);

check(
  'BT1 server POST /api/bugs/snapshot',
  serverBug.includes("app.post('/api/bugs/snapshot'") &&
    serverBug.includes('bugShotKey') &&
    serverBug.includes('manifest.json')
);

check(
  'BT1 Fab floating + multi-shot + settings toggle',
  fab.includes('bug-snapshot-fab') &&
    fab.includes('Capture screen') &&
    fab.includes('BugSnapshotSettingsToggle') &&
    fab.includes('/api/bugs/snapshot')
);

check(
  'BT1 Header wires Fab + settings toggle',
  header.includes('BugSnapshotFab') &&
    header.includes('BugSnapshotSettingsToggle') &&
    header.includes('bug-snapshot-fab')
);

check(
  'BT2 identified_problems field UX + PATCH support',
  tracker.includes('identified_problems') &&
    tracker.includes('Identified problems') &&
    backlog.includes('identified_problems') &&
    mig.includes('identified_problems')
);

check(
  'BT2 issue type dropped from Flag form primary UX',
  !flag.includes('Issue Type') &&
    flag.includes('Identified problem') &&
    flag.includes("issue_type: 'general_bug'") &&
    backlog.includes('DEFAULT_ISSUE_TYPE')
);

check(
  'BT2 prune report artifacts',
  serverBug.includes('/prune') && tracker.includes('pruneReport')
);

check(
  'BT2 brief-first copy (full dump on shift)',
  tracker.includes('fullDump') && tracker.includes('Shift+click')
);

check(
  'BT3 triage route + Analyze button + model dropdown',
  serverBug.includes("app.post('/api/bugs/:tagId/triage'") &&
    serverBug.includes('BUG_TRIAGE_LOG') &&
    serverBug.includes('buildBugTriageSystemPrompt') &&
    tracker.includes('runTriage') &&
    tracker.includes('Analyze') &&
    tracker.includes('AVAILABLE_LLMS')
);

check(
  'BT3 fail-open preserves prior identified_problems',
  serverBug.includes('preserved_identified_problems')
);

check(
  'BT4 brief APIs /api/bugs/open and /api/bugs/:tagId',
  serverBug.includes("app.get('/api/bugs/open'") &&
    serverBug.includes("app.get('/api/bugs/:tagId'") &&
    serverBug.includes('artifacts') &&
    util.includes('export function briefFromTag')
);

check(
  'Server registers registerBugSnapshotRoutes with callUnifiedLLM',
  server.includes('registerBugSnapshotRoutes') &&
    server.includes('callUnifiedLLM') &&
    server.includes('getS3Client')
);

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
