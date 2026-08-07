const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const logic = `
app.post('/api/jobs/upsert', async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload || !payload.id || !payload.user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In production, we should authenticate the user making the request (e.g. verify Firebase token)
    // But for the scope of this task, we will just use supabaseAdmin to write the record.
    const { error } = await supabaseAdmin.from('agent_jobs').upsert(payload, { onConflict: 'id' });
    
    if (error) {
      console.error('Failed to upsert job to Supabase via server:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to upsert job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
`;

if (!content.includes('/api/jobs/upsert')) {
  content = content.replace('const app = express();', 'const app = express();\n' + logic);
  fs.writeFileSync('server.ts', content);
}
