const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const foodAnalyzeTarget = `
    res.json = (body: any) => {
      const sessionId = logSessionStorage.getStore() || "global";
      const logsToUse = sessionDebugLogs[sessionId] || globalDebugLogs;
      body.agentResult = body.agentResult || {};
      body.agentResult.backendLogs = logsToUse.slice(initialLogCount).map((l: any) => \`[\${l.timestamp}] \${l.message}\`).join('\\n');
`;

const foodAnalyzeReplacement = `
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
               clean_result: { pendingFoodLog: cleanResult, photoUrl },
               updated_at: new Date().toISOString()
            }).eq('id', jobId).then(() => {
               console.log('[Background Worker] Successfully saved job to Supabase:', jobId);
            }).catch(e => console.error('Failed to update supabase', e));
         });
      }
`;

content = content.replace(foodAnalyzeTarget, foodAnalyzeReplacement);
fs.writeFileSync('server.ts', content);
console.log('Patched food-analyze');
