import fs from 'fs';
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');

// 1. Add reviewBiomarkerKey to LogChatProps
code = code.replace(
  /agentType\?: 'agent1' \| 'agent2' \| 'agent3' \| 'agent4' \| 'agent5' \| 'agent7' \| 'data_review' \| 'health_baseline' \| null;/,
  `agentType?: 'agent1' | 'agent2' | 'agent3' | 'agent4' | 'agent5' | 'agent7' | 'data_review' | 'health_baseline' | 'biomarker_review' | null;\n  reviewBiomarkerKey?: string;`
);

// 2. Add buildReviewBiomarkerContext import
code = code.replace(
  /import \{ biomarkerDefinitions, getBiomarkerStatus, isAsianEthnicity, getBiomarkerStatusLabel, isBiomarkerValueImprobable, getMergedBiomarkerDef, detectFlaggedTelemetryErrors \} from '\.\.\/utils\/biomarkers';/,
  `import { biomarkerDefinitions, getBiomarkerStatus, isAsianEthnicity, getBiomarkerStatusLabel, isBiomarkerValueImprobable, getMergedBiomarkerDef, detectFlaggedTelemetryErrors, buildReviewBiomarkerContext } from '../utils/biomarkers';`
);

// 3. Inject it into the bodyData
const injection = `
      if (agentType === 'biomarker_review' && reviewBiomarkerKey) {
        bodyData.customVariableData = buildReviewBiomarkerContext(
          reviewBiomarkerKey,
          biomarkers?.[reviewBiomarkerKey] || '',
          biomarkerDefinitions,
          biomarkerHistory || [],
          profile
        );
      }
`;

code = code.replace(
  /const bodyData: any = \{\s*message: type === 'food_idea' \? JSON\.stringify\(locationParams\) : userMsgText,/,
  `const bodyData: any = {\n        message: type === 'food_idea' ? JSON.stringify(locationParams) : userMsgText,\n${injection}`
);

fs.writeFileSync('src/components/LogChat.tsx', code);
