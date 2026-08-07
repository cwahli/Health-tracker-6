const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const medicalAnalyzeTarget = `
app.post("/api/gemini/medical-analyze", async (req, res) => {
  const isStream = req.query.stream === 'true';
  let hasSentHeaders = false;
  const sessionId = logSessionStorage.getStore() || "global";
  const initialLogCount = (sessionDebugLogs[sessionId] || globalDebugLogs).length;

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.flushHeaders();
    hasSentHeaders = true;

    const originalStatus = res.status.bind(res);
    res.status = (code: number) => {
      if (!res.headersSent) {
        originalStatus(code);
      }
      return res;
    };

    res.json = (body: any) => {
      const sessionId = logSessionStorage.getStore() || "global";
      const logsToUse = sessionDebugLogs[sessionId] || globalDebugLogs;
      body.agentResult = body.agentResult || {};
      body.agentResult.backendLogs = logsToUse.slice(initialLogCount).map((l: any) => \`[\${l.timestamp}] \${l.message}\`).join('\\n');
`;

const medicalAnalyzeReplacement = `
app.post("/api/gemini/medical-analyze", async (req, res) => {
  const isStream = req.query.stream === 'true';
  let hasSentHeaders = false;
  const sessionId = logSessionStorage.getStore() || "global";
  const initialLogCount = (sessionDebugLogs[sessionId] || globalDebugLogs).length;

  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.flushHeaders();
    hasSentHeaders = true;

    const originalStatus = res.status.bind(res);
    res.status = (code: number) => {
      if (!res.headersSent) {
        originalStatus(code);
      }
      return res;
    };

    res.json = (body: any) => {
      const sessionId = logSessionStorage.getStore() || "global";
      const logsToUse = sessionDebugLogs[sessionId] || globalDebugLogs;
      body.agentResult = body.agentResult || {};
      body.agentResult.backendLogs = logsToUse.slice(initialLogCount).map((l: any) => \`[\${l.timestamp}] \${l.message}\`).join('\\n');
      
      const jobId = req.body.jobId;
      const photoUrl = req.body.photoUrl;
      if (jobId) {
         import('./supabaseAdmin.js').then(({ supabaseAdmin }) => {
            let cleanResult = JSON.parse(JSON.stringify(body));
            if (cleanResult.agentResult) delete cleanResult.agentResult.backendLogs;
            if (cleanResult.raw) delete cleanResult.raw;
            
            supabaseAdmin.from('agent_jobs').update({
               status: 'succeeded',
               progress_percent: 100,
               status_message: 'Completed successfully',
               clean_result: { data: cleanResult, photoUrl },
               updated_at: new Date().toISOString()
            }).eq('id', jobId).then(() => {
               console.log('[Background Worker] Successfully saved medical job to Supabase:', jobId);
            }).catch(e => console.error('Failed to update supabase', e));
         });
      }
`;

content = content.replace(medicalAnalyzeTarget, medicalAnalyzeReplacement);
fs.writeFileSync('server.ts', content);
console.log('Patched medical-analyze');
