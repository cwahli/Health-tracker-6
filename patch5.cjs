const fs = require('fs');
let code = fs.readFileSync('serverIssueBacklog.ts', 'utf-8');

if (!code.includes('export const DEFAULT_ISSUE_TYPE = \'general_bug\';')) {
  code = "export const DEFAULT_ISSUE_TYPE = 'general_bug';\n" + code;
}

// Ensure identified_problems is selected in issue_tags
code = code.replace(
  ".select('id, created_at, title, category, status, resolution_note, whats_still_open, comments')",
  ".select('id, created_at, title, category, status, resolution_note, whats_still_open, comments, identified_problems')"
);

// Ensure it can be patched via PUT /api/issue-tags/:id
code = code.replace(
  "const { resolution_note, append_note, title, whats_still_open, status } = req.body || {};",
  "const { resolution_note, append_note, title, whats_still_open, status, identified_problems } = req.body || {};"
);

code = code.replace(
  "if (title !== undefined) patch.title = String(title).trim() || 'Untitled';",
  "if (title !== undefined) patch.title = String(title).trim() || 'Untitled';\n      if (identified_problems !== undefined) patch.identified_problems = String(identified_problems).trim();"
);

code = code.replace(
  "return res.status(400).json({ error: 'Provide resolution_note, whats_still_open, status, or title' });",
  "return res.status(400).json({ error: 'Provide resolution_note, whats_still_open, status, title, or identified_problems' });"
);

fs.writeFileSync('serverIssueBacklog.ts', code);
