import fs from 'fs';
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');

code = code.replace(
  /agentType,\s*onOpenAgentFromFrontDesk,\s*biomarkerHistory/,
  `agentType,\n  reviewBiomarkerKey,\n  onOpenAgentFromFrontDesk,\n  biomarkerHistory`
);

fs.writeFileSync('src/components/LogChat.tsx', code);
