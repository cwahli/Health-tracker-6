const fs = require('fs');

const logic = `
// --- BACKGROUND WORKER (PHASE C) ---
app.post('/api/jobs/execute-background', async (req, res) => {
  const { jobId, jobInput, agentType, photoUrl } = req.body;
  res.json({ success: true, message: 'Job started in background' });
  
  setTimeout(async () => {
    try {
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      
      await supabaseAdmin.from('agent_jobs').update({
        status: 'running',
        status_message: 'Starting analysis...',
        progress_percent: 5,
        photo_url: photoUrl
      }).eq('id', jobId);

      const endpoint = agentType === 'medical' ? '/api/gemini/medical-analyze?stream=true' : '/api/gemini/food-analyze?stream=true';
      const fetchRes = await fetch(\`http://127.0.0.1:3000\${endpoint}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobInput)
      });

      if (!fetchRes.ok) {
        throw new Error(\`Failed to start agent: \${fetchRes.status}\`);
      }

      const reader = fetchRes.body.getReader();
      const decoder = new TextDecoder();
      let lineBuffer = "";
      
      let finalResult = null;
      let lastProgressUpdate = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        lineBuffer += decoder.decode(value, { stream: true });
        
        while (true) {
          let separatorIdx = lineBuffer.indexOf("\\n\\n");
          if (separatorIdx === -1) break;
          
          const ev = lineBuffer.substring(0, separatorIdx).trim();
          lineBuffer = lineBuffer.substring(separatorIdx + 2);
          
          if (ev.startsWith("data: ")) {
            try {
              const data = JSON.parse(ev.slice(6));
              
              if (data.type === 'status' || data.logType) {
                // Update progress occasionally
                const now = Date.now();
                if (now - lastProgressUpdate > 3000) {
                  lastProgressUpdate = now;
                  await supabaseAdmin.from('agent_jobs').update({
                    status_message: data.message || \`Analyzing (\${data.stage || 'scout'})...\`,
                    progress_percent: 40
                  }).eq('id', jobId);
                }
              } else if (data.final) {
                finalResult = data.result;
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
      
      // Attempt to parse any remainder
      if (lineBuffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(lineBuffer.slice(6));
          if (data.final) finalResult = data.result;
          else if (data.error) throw new Error(data.error);
        } catch (e) {}
      }

      if (finalResult) {
        // Strip raw to save space
        if (finalResult.raw) delete finalResult.raw;
        if (finalResult.data?.raw) delete finalResult.data.raw;
        
        const cleanResult = {
           ...(agentType === 'medical' ? { data: finalResult } : { pendingFoodLog: finalResult }),
           photoUrl: photoUrl
        };
        
        await supabaseAdmin.from('agent_jobs').update({
          status: 'succeeded',
          progress_percent: 100,
          status_message: 'Completed successfully',
          clean_result: cleanResult,
          updated_at: new Date().toISOString()
        }).eq('id', jobId);
      } else {
        throw new Error('No final result received from stream');
      }

    } catch (err) {
      console.error('[Background Worker] Job failed:', err);
      const { supabaseAdmin } = await import('./supabaseAdmin.js');
      await supabaseAdmin.from('agent_jobs').update({
        status: 'failed',
        status_message: err.message || 'Analysis failed',
        updated_at: new Date().toISOString()
      }).eq('id', jobId);
    }
  }, 0);
});
`;

let content = fs.readFileSync('server.ts', 'utf8');
if (!content.includes('/api/jobs/execute-background')) {
  content = content.replace('const app = express();', 'const app = express();\n' + logic);
  fs.writeFileSync('server.ts', content);
}
