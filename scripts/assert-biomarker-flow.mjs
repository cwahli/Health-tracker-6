import fs from 'node:fs';
const src = (f) => fs.readFileSync(f, 'utf-8');
const logChat = src('src/components/LogChat.tsx');
const appTsx = src('src/App.tsx');

let pass = true;

// B1: biomarker_review excluded from auto-send
if (!logChat.includes("agentType === 'biomarker_review'") || !logChat.match(/biomarker_review.*return/)) {
  console.error('❌ B1 FAIL: Auto-send for biomarker_review not suppressed'); pass = false;
} else console.log('✅ B1 PASS: biomarker_review excluded from auto-send');

// B2: Duplicate job guard present
if (!logChat.includes('B2 FIX') || !logChat.includes('Skipping duplicate job')) {
  console.error('❌ B2 FAIL: Duplicate job guard missing'); pass = false;
} else console.log('✅ B2 PASS: Duplicate job guard present');

// B3: Apply button sets isAnalyzing during onAgentFinish
if (!logChat.includes('B3 FIX') || !logChat.includes('setIsAnalyzing(true)')) {
  console.error('❌ B3 FAIL: Apply button loading state missing'); pass = false;
} else console.log('✅ B3 PASS: Apply button loading state present');

// B4: agentType restored from job snapshot on View Result
if (!appTsx.includes('B4 FIX') || !appTsx.includes('Restore agentType from job snapshot')) {
  console.error('❌ B4 FAIL: agentType not restored on modal reopen'); pass = false;
} else console.log('✅ B4 PASS: agentType restored from job snapshot');

// B5: biomarker_review branch in onAgentFinish
if (!appTsx.includes('B5 FIX') || !appTsx.includes("agentType as string) === 'biomarker_review'")) {
  console.error('❌ B5 FAIL: biomarker_review branch missing from onAgentFinish'); pass = false;
} else console.log('✅ B5 PASS: biomarker_review branch in onAgentFinish');

// B6: Hardcoded 'medical' agentType fixed + log entry emitted
if (!appTsx.includes('B6 FIX') || !appTsx.includes('realAgentType') || !appTsx.includes('handleLogMedical')) {
  console.error('❌ B6 FAIL: Job result agentType still hardcoded or log entry missing'); pass = false;
} else console.log('✅ B6 PASS: Real agentType used and log entry emitted');

if (!pass) { console.error('=== GATE FAILED ==='); process.exit(1); }
console.log('=== ALL ASSERTIONS PASSED (exit 0) ===');
process.exit(0);
