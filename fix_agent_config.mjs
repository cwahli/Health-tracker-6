import fs from 'fs';
let code = fs.readFileSync('src/utils/agentConfig.ts', 'utf-8');
if (!code.includes('biomarker_review: {')) {
  code = code.replace(
    '  health_baseline: {',
    "  biomarker_review: {\n    id: 'biomarker_review',\n    category: 'medical',\n    displayName: 'Biomarker Review Agent',\n    description: 'Reviews specific biomarker entries.',\n    capabilities: ['biomarker_analysis'],\n    welcomeMessage: 'Let us review your biomarker.',\n    rolloutStatus: 'unified',\n  },\n  health_baseline: {"
  );
  fs.writeFileSync('src/utils/agentConfig.ts', code);
}
