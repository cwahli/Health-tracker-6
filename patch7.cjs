const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Add import
const targetImport = "import { registerIssueBacklogRoutes } from './serverIssueBacklog.js';";
const replImport = "import { registerIssueBacklogRoutes } from './serverIssueBacklog.js';\nimport { registerBugSnapshotRoutes } from './serverBugSnapshot.js';";
code = code.replace(targetImport, replImport);

// Add call
const targetCall = `registerIssueBacklogRoutes(app, {
  addDebugLog: (msg: string, sessionId?: string) => addDebugLog(msg, sessionId),
  globalDebugLogs: typeof globalDebugLogs !== 'undefined' ? globalDebugLogs : [],
  sessionDebugLogs: typeof sessionDebugLogs !== 'undefined' ? sessionDebugLogs : {},
});`;
const replCall = targetCall + `\n\n// --- Bug snapshot + AI triage ---
registerBugSnapshotRoutes(app, {
  callUnifiedLLM,
  getS3Client,
  bucketName: CLOUDFLARE_R2_BUCKET_NAME,
  publicUrlBase: CLOUDFLARE_R2_PUBLIC_URL,
  addDebugLog: (msg: string, sessionId?: string) => addDebugLog(msg, sessionId),
});`;

code = code.replace(targetCall, replCall);

fs.writeFileSync('server.ts', code);
