/**
 * Gate: Initiative K complete (no session replay) — K1–K5 surface checks
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

const packs = read('src/utils/bugDomainPacks.ts');
const snap = read('src/utils/bugSnapshot.ts');
const server = read('serverBugSnapshot.ts');
const fab = read('src/components/BugSnapshotFab.tsx');
const tracker = read('src/components/BugTrackerModal.tsx');
const backlog = read('serverIssueBacklog.ts');
const agents = read('AGENTS.md');
const plan = read('plan/BUG_TRACKING_COMPREHENSIVE_PLAN.md');

// K1
check('K1 food+biomarker packs', packs.includes('buildFoodDomainPack') && packs.includes('buildBiomarkerDomainPack'));
check('K1 a11y default all agents', snap.includes("AGENT_STRUCTURE_DEFAULT = 'a11y'") && snap.includes('ALL models'));
check('K1 domain_pack.json on server', server.includes('domain_pack.json') && server.includes('overview.md'));

// K2 durable triage
check('K2 triage job map + status routes', server.includes('triageJobs') && server.includes('/api/bugs/triage-jobs/'));
check('K2 executeTriageForTag + fail-open preserved', server.includes('executeTriageForTag') && server.includes('preserved'));
check('K2 JobStore bug_triage on Fab', fab.includes("kind: 'bug_triage'") || fab.includes('bug_triage'));
check('K2 Analyze/Retry + field lock', tracker.includes('Analyze / Retry') && tracker.includes('triage running'));

// K3 capture polish
check('K3 interaction ring', snap.includes('initInteractionRecorder') && snap.includes('MAX_INTERACTIONS'));
check('K3 draft sessionStorage', snap.includes('BUG_SNAPSHOT_DRAFT_KEY') && fab.includes('saveBugSnapshotDraft'));
check('K3 paste + webp', fab.includes('paste') && snap.includes('compressToWebpOrJpeg'));
check('K3 checklist + scrub', snap.includes('buildCaptureChecklist') && snap.includes('scrubPiiText'));

// K4 auto-triage
check('K4 auto_triage + summary.md', server.includes('auto_triage') && server.includes('summary.md'));
check('K4 auto triage settings', fab.includes('isBugAutoTriageEnabled') && fab.includes('Auto-triage after snapshot'));

// K5 archive + hydrate + zip
check('K5 archive older instances', server.includes('/archive/') && server.includes('archived_at'));
check('K5 overview exposes domain + r2_shots', backlog.includes('domain_summary') && backlog.includes('r2_shots'));
check('K5 zip download', tracker.includes('downloadTagZip') && tracker.includes('domain_pack.json'));

// K6 docs / no session replay requirement
check('K6 plan defers session replay', plan.includes('Session Replay') && /out of scope|deferred|Forget|won't need|No full Session Replay/i.test(plan));
check('K6 AGENTS a11y default', agents.includes('a11y') && agents.includes('/api/bugs/open'));

// Session replay must not be required as feature
check('No Session Replay product required in Fab', !fab.includes('SessionReplay') && !fab.includes('session_replay'));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
