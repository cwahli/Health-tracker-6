import fs from 'fs';
import path from 'path';

console.log('[assert-async-durable-remaining] Running remaining durable async assertions...');

// 1. serverJobs.ts has food-analyze or in-process analyze + pendingFoodLog
const serverJobs = fs.readFileSync('serverJobs.ts', 'utf8');
if (!/food-analyze|runFoodAnalyze/i.test(serverJobs) || !/pendingFoodLog/.test(serverJobs)) {
  console.error('FAIL: serverJobs.ts missing food-analyze or pendingFoodLog');
  process.exit(1);
}

// 2. Not only stub Analyzed Meal without pendingFoodLog
if (/pendingFoodLog\s*:\s*null/.test(serverJobs) && !/finalData\.pendingFoodLog/.test(serverJobs)) {
  console.error('FAIL: serverJobs.ts uses stub instead of real pendingFoodLog');
  process.exit(1);
}

// 3. LogChat has jobs/submit + failed handling
const logChat = fs.readFileSync('src/components/LogChat.tsx', 'utf8');
if (!/jobs\/submit/.test(logChat) || !/failed|Submission Failed|status:\s*['"]failed['"]/.test(logChat)) {
  console.error('FAIL: LogChat.tsx missing jobs/submit or failed status handling');
  process.exit(1);
}

// 4. App has server poll for food_log / food_compare
const app = fs.readFileSync('src/App.tsx', 'utf8');
if (!/jobs\/status/.test(app) || !/food_log/.test(app)) {
  console.error('FAIL: App.tsx missing server job status polling');
  process.exit(1);
}

// 5. FoodHistoryTab does not return false on queued
const foodHistory = fs.readFileSync('src/components/FoodHistoryTab.tsx', 'utf8');
if (/status === ['"]queued['"]\)\s*return false/.test(foodHistory)) {
  console.error('FAIL: FoodHistoryTab hides queued jobs');
  process.exit(1);
}

// 6. JobQueueRunner or App skips re-R2 when server urls present
const runner = fs.readFileSync('src/jobs/JobQueueRunner.ts', 'utf8');
if (!/isServerOwned|photoUrl|debugUrl|skip/.test(runner)) {
  console.error('FAIL: JobQueueRunner does not check for server URLs or server-owned state');
  process.exit(1);
}

// 7. No nav-tab-medical
const fileTree = fs.readdirSync('src', { recursive: true });
const navTabMedical = fileTree.some(f => String(f).includes('nav-tab-medical'));
if (navTabMedical) {
  console.error('FAIL: nav-tab-medical exists');
  process.exit(1);
}

// 8. r2Storage has /api/r2/upload-photo client path
const r2Storage = fs.readFileSync('src/utils/r2Storage.ts', 'utf8');
if (!/uploadPhotoToR2|upload-photo/.test(r2Storage)) {
  console.error('FAIL: r2Storage missing uploadPhotoToR2 or /api/r2/upload-photo');
  process.exit(1);
}

console.log('PASS assert-async-durable-remaining!');
