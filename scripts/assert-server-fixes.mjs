import fs from 'fs';

console.log('[assert-server-fixes] Running F1-F5 server correctness assertions...');

const serverContent = fs.readFileSync('server.ts', 'utf8');
const packageContent = fs.readFileSync('package.json', 'utf8');

// F1: Request-scoped DDG search counter
if (!/interface\s+SearchRequestContext/.test(serverContent)) {
  console.error('FAIL F1: SearchRequestContext interface not defined');
  process.exit(1);
}
if (!/ctx:\s*SearchRequestContext\s*=\s*{\s*ddgCallCount:\s*0,\s*ddgBlocked:\s*false\s*}/.test(serverContent)) {
  console.error('FAIL F1: searchOnlineWebNutrition does not take SearchRequestContext ctx parameter');
  process.exit(1);
}
if (!/ctx\.ddgCallCount/.test(serverContent) || !/ctx\.ddgBlocked/.test(serverContent)) {
  console.error('FAIL F1: searchOnlineWebNutrition does not utilize ctx parameter');
  process.exit(1);
}
if (/ddgCallCountThisRequest/.test(serverContent) || /ddgBlockedThisRequest/.test(serverContent)) {
  console.error('FAIL F1: found stale ddgCallCountThisRequest or ddgBlockedThisRequest');
  process.exit(1);
}
if (!/searchOnlineWebNutrition\(q,\s*detectedChainKey,\s*searchCtx\)/.test(serverContent)) {
  console.error('FAIL F1: searchOnlineWebNutrition call site does not pass searchCtx');
  process.exit(1);
}

// F2: Robust LLM JSON extractor (safeExtractJsonObject)
if (!/function\s+safeExtractJsonObject/.test(serverContent)) {
  console.error('FAIL F2: safeExtractJsonObject helper not defined');
  process.exit(1);
}
if (!/parsed\s*=\s*safeExtractJsonObject/.test(serverContent)) {
  console.error('FAIL F2: executeFoodResolverAgent does not use safeExtractJsonObject');
  process.exit(1);
}

// F3: SSE close/finish listener cleanup
if (!/res\.on\("finish",\s*cleanupStream\)/.test(serverContent) || !/res\.on\("error",\s*cleanupStream\)/.test(serverContent)) {
  console.error('FAIL F3: res finish or error listeners not cleanup properly in SSE');
  process.exit(1);
}

// F4: Package.json duplicate vite dependency removed
const parsedPackage = JSON.parse(packageContent);
if (parsedPackage.dependencies && parsedPackage.dependencies.vite) {
  console.error('FAIL F4: vite dependency still exists in dependencies of package.json');
  process.exit(1);
}

// F5: Redundant firebase-admin/auth import cleaned up
if (serverContent.includes("import { getAuth, getAuth as getAdminAuth } from 'firebase-admin/auth';")) {
  console.error('FAIL F5: redundant firebase-admin/auth import remains');
  process.exit(1);
}

console.log('=== ALL ASSERTIONS PASSED (exit 0) ===');
process.exit(0);
