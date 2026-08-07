const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `systemInstruction = \`You are an elite Medical Diagnostics Assessment agent.
Your objective is to analyze the user's biomarker history to project timeline risks and identify testing gaps. 

CRITICAL INSTRUCTIONS:`;

const newStr = `systemInstruction = \`You are an elite Medical Diagnostics Assessment agent.
Your objective is to analyze the user's biomarker history to project timeline risks and identify testing gaps. 

=== INPUT DATA PROVIDED TO YOU ===
1. User Profile Data:
\${JSON.stringify({
  age: userProfile?.age,
  gender: userProfile?.gender,
  ethnicity: userProfile?.ethnicity,
  medicalConditions: userProfile?.medicalConditions,
  healthGoals: userProfile?.healthGoals
}, null, 2)}

2. Accepted Agent Finding Proposal from Health Baseline & Trajectory Agent:
\${JSON.stringify(acceptedBaselineProposal, null, 2)}

3. Latest Biomarker Values AT RISK (with range and medical insights):
\${JSON.stringify(atRiskBiomarkers, null, 2)}

4. Latest Biomarker Values NOT AT RISK:
\${JSON.stringify(normalBiomarkers, null, 2)}

5. Last 15 Meals Logged (Titles):
\${JSON.stringify(last15MealTitles, null, 2)}

6. Existing Clinical Action Recommendations List:
\${JSON.stringify(existingActions, null, 2)}

=== CRITICAL INSTRUCTIONS ===`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('server.ts', code);
