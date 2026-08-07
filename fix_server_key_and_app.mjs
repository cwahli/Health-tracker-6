import fs from 'fs';
let serverCode = fs.readFileSync('server.ts', 'utf-8');
serverCode = serverCode.replace(
  /if \(agentType === "biomarker_review" && biomarkerKey\) \{/g,
  'if (agentType === "biomarker_review" && req.body.biomarkerKey) {'
);
serverCode = serverCode.replace(
  /dataContext \+= `\\n\\nBIOMARKER TO REVIEW: \$\{biomarkerKey\}\\n`;/g,
  'dataContext += `\\n\\nBIOMARKER TO REVIEW: ${req.body.biomarkerKey}\\n`;'
);
// wait I added biomarkerKey in the previous script to the destructuring
serverCode = serverCode.replace(/, biomarkerKey } = req.body;/g, '} = req.body;');

fs.writeFileSync('server.ts', serverCode);

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
let matchCount = 0;
appCode = appCode.replace(/onOpenAgentChat=\{\(agentType, options\) => \{[\s\S]*?setIsMedicalChatOpen\(true\);\s*\}\}/g, (match) => {
  matchCount++;
  if (matchCount === 3) return "";
  return match;
});
fs.writeFileSync('src/App.tsx', appCode);
