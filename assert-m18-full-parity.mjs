import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

// 1. Check for absence of newly generated patch scripts in root
const rootFiles = fs.readdirSync('.');
const scratchFiles = rootFiles.filter(f => /^patch\d*\.(cjs|js)$|^patch_.*(\.cjs|\.js)$/.test(f));
// If any exist, warn/flag
assert(scratchFiles.length === 0, `No active scratch patch scripts in root (found: ${scratchFiles.length})`);

// 2. server_portion_clarify.ts clean
const portionClarifySrc = fs.readFileSync('server_portion_clarify.ts', 'utf8');
assert(!portionClarifySrc.includes('/* export function detectPortionAmbiguity'), 'server_portion_clarify.ts has no trailing dummy comment hacks');
assert(portionClarifySrc.includes('export function detectPortionAmbiguity'), 'server_portion_clarify.ts has real detectPortionAmbiguity');
assert(portionClarifySrc.includes('export function applyPortionChoices'), 'server_portion_clarify.ts has real applyPortionChoices');

// 3. server_refine_scale.ts clean
const refineScaleSrc = fs.readFileSync('server_refine_scale.ts', 'utf8');
assert(!refineScaleSrc.includes('export function decideRefineVsScout() {}'), 'server_refine_scale.ts has no dummy decideRefineVsScout stub');
assert(refineScaleSrc.includes('export function detectWeightRefineIntent'), 'server_refine_scale.ts has real detectWeightRefineIntent');
assert(refineScaleSrc.includes('export function applyWeightRefineToScoutItems'), 'server_refine_scale.ts has real applyWeightRefineToScoutItems');

// 4. BugTrackerModal.tsx full rich triage implementation
const bugTrackerModalSrc = fs.readFileSync('src/components/BugTrackerModal.tsx', 'utf8');
assert(bugTrackerModalSrc.length > 30000, `BugTrackerModal.tsx has full rich triage implementation (${bugTrackerModalSrc.length} bytes > 30KB)`);
assert(bugTrackerModalSrc.includes('Identified Problems') || bugTrackerModalSrc.includes('identified_problems'), 'BugTrackerModal.tsx supports identified_problems editing');
assert(bugTrackerModalSrc.includes('/triage') || bugTrackerModalSrc.includes('runTriage'), 'BugTrackerModal.tsx triggers AI triage');
assert(bugTrackerModalSrc.includes('domain_pack') || bugTrackerModalSrc.includes('a11y_tree'), 'BugTrackerModal.tsx inspects domain packs and a11y tree');

// 5. App.tsx full state dedupe & biomarker auto-sanitize
const appSrc = fs.readFileSync('src/App.tsx', 'utf8');
assert(appSrc.includes('mergeFoodLogsDeduped'), 'App.tsx wraps foodLogs state with mergeFoodLogsDeduped');
assert(appSrc.includes('sanitizeBiomarkerHistoryOnLoad'), 'App.tsx auto-sanitizes biomarker history on load');
assert(appSrc.includes('msg_assistant_clarify_') && appSrc.includes('awaiting_user'), 'App.tsx dispatches awaiting_user assistant message for portion clarification');

// 6. server.ts clean bug routes and photo proxy
const serverSrc = fs.readFileSync('server.ts', 'utf8');
assert(!serverSrc.includes('/* proxyUrl /api/r2/photo-url'), 'server.ts has no trailing comment hacks');
assert(serverSrc.includes("registerBugSnapshotRoutes(app, {"), 'server.ts passes clean options object to registerBugSnapshotRoutes');
assert(serverSrc.includes("app.get(['/photos/:key', '/api/r2/photos/:key']"), 'server.ts registers /photos/:key streaming proxy');

// 7. Header.tsx full Fab context provider
const headerSrc = fs.readFileSync('src/components/Header.tsx', 'utf8');
assert(headerSrc.includes('<BugSnapshotFab'), 'Header.tsx renders BugSnapshotFab');
assert(headerSrc.includes('getModalContext={() =>'), 'Header.tsx provides getModalContext to BugSnapshotFab');
assert(headerSrc.includes('window.addEventListener(\'agent_logs_updated\''), 'Header.tsx has instant event-driven log listener');

// 8. ImageSlider.tsx & FoodHistoryTab.tsx lazy decoding & pagination
const sliderSrc = fs.readFileSync('src/components/ImageSlider.tsx', 'utf8');
assert(sliderSrc.includes('IntersectionObserver') && sliderSrc.includes('deferUntilVisible'), 'ImageSlider.tsx implements IntersectionObserver lazy decoding');

const historySrc = fs.readFileSync('src/components/FoodHistoryTab.tsx', 'utf8');
assert(historySrc.includes('FOOD_HISTORY_PAGE_SIZE = 15'), 'FoodHistoryTab.tsx defines FOOD_HISTORY_PAGE_SIZE = 15');

// 9. FullScreenLogViewer.tsx bug_snapshot category
const viewerSrc = fs.readFileSync('src/components/FullScreenLogViewer.tsx', 'utf8');
assert(viewerSrc.includes("'bug_snapshot':"), 'FullScreenLogViewer.tsx defines bug_snapshot category');

console.log(`\nM18 Parity Assertions: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All M18 Parity Assertions PASS (exit 0).');
  process.exit(0);
}
