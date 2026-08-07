import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /onOpenAgentChat=\{\(agentType: 'agent1' \| 'agent2' \| 'agent3' \| 'agent4' \| 'agent5' \| 'health_baseline' \| 'agent7' \| 'data_review' \| 'biomarker_review', options\?: \{/,
  `onOpenAgentChat={(agentType: 'agent1' | 'agent2' | 'agent3' | 'agent4' | 'agent5' | 'health_baseline' | 'agent7' | 'data_review' | 'biomarker_review', options?: {
              biomarkerKey?: string;`
);

fs.writeFileSync('src/App.tsx', code);
