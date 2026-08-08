const fs = require('fs');
let code = fs.readFileSync('src/components/FlagIssueModal.tsx', 'utf-8');

// Replace Note (optional) with Identified problem (optional)
code = code.replace(
  '<label className="block text-[11px] font-bold text-white/90">\n                  Note (optional)\n                </label>',
  '<label className="block text-[11px] font-bold text-white/90">\n                  Identified problem (optional)\n                </label>'
);

// Remove the Issue Type section
const issueTypeStart = code.indexOf('{/* Issue Type */}');
const issueTypeEnd = code.indexOf('{/* Note */}');
if (issueTypeStart !== -1 && issueTypeEnd !== -1) {
  code = code.substring(0, issueTypeStart) + code.substring(issueTypeEnd);
}

// In the payload, use issue_type: 'general_bug'
code = code.replace(
  'issue_type: ent.issueType === \'other\' ? ent.customIssueType.trim() || \'other\' : ent.issueType,',
  'issue_type: \'general_bug\','
);

fs.writeFileSync('src/components/FlagIssueModal.tsx', code);
