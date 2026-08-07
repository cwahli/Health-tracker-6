import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add setActiveReviewBiomarkerKey to onOpenAgentChat
code = code.replace(
  /setActiveAgentType\(agentType\);\n\s*setPrefillMessage\(options\?\.prefillMessage \|\| null\);/,
  `setActiveAgentType(agentType);
              setPrefillMessage(options?.prefillMessage || null);
              setActiveReviewBiomarkerKey(options?.biomarkerKey);`
);

// 2. Add activeReviewBiomarkerKey to LogChat type="medical"
code = code.replace(
  /agentType=\{activeAgentType\}/,
  `agentType={activeAgentType}
        biomarkerKey={activeReviewBiomarkerKey}`
);

fs.writeFileSync('src/App.tsx', code);
