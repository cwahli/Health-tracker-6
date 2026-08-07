import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /onOpenAgentChat=\{\(agentType:\s*'agent1'\s*\|\s*'agent2'\s*\|\s*'agent3'\s*\|\s*'agent4'\s*\|\s*'agent5'\s*\|\s*'health_baseline'\s*\|\s*'agent7'\s*\|\s*'data_review'\s*\|\s*'biomarker_review',\s*options\?:\s*\{([^}]+)\}\)\s*=>\s*\{/,
  (match, p1) => {
    if (!p1.includes('biomarkerKey?: string;')) {
      return \`onOpenAgentChat={(agentType: 'agent1' | 'agent2' | 'agent3' | 'agent4' | 'agent5' | 'health_baseline' | 'agent7' | 'data_review' | 'biomarker_review', options?: {
              biomarkerKey?: string;\${p1}}) => {\`;
    }
    return match;
  }
);

fs.writeFileSync('src/App.tsx', code);
