import fs from 'fs';
let code = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');

code = code.replace(
  /agentType = null,/,
  `agentType = null,
  reviewBiomarkerKey,`
);

// We need to pass reviewBiomarkerKey to the API request when type is medical and agentType is biomarker_review
code = code.replace(
  /userProfile: lightProfile\n\s*\};/,
  `userProfile: lightProfile,
        biomarkerKey: reviewBiomarkerKey
      };`
);

fs.writeFileSync('src/components/LogChat.tsx', code);
