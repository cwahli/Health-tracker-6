const fs = require('fs');
let code = fs.readFileSync('src/components/FlagIssueModal.tsx', 'utf-8');

code = code.replace(
  "issue_type: ent.issueType,",
  "issue_type: 'general_bug',"
);
code = code.replace(
  "custom_issue_type: ent.issueType === 'other' ? ent.customIssueType.trim() : undefined,",
  ""
);

fs.writeFileSync('src/components/FlagIssueModal.tsx', code);
