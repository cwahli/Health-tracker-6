const fs = require('fs');
let code = fs.readFileSync('src/components/FlagIssueModal.tsx', 'utf-8');

// Replace custom issue type error
code = code.replace(
  "if (ent.issueType === 'other' && !ent.customIssueType.trim()) {",
  "if (false) {"
);
code = code.replace(
  "setError(`Please specify the custom issue type in issue #${i + 1}.`);",
  "// removed"
);
code = code.replace(
  "return false;",
  "// removed"
);

fs.writeFileSync('src/components/FlagIssueModal.tsx', code);
