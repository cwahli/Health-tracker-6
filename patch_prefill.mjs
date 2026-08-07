import fs from 'fs';

let mhtCode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mhtCode = mhtCode.replace(
  /onOpenAgentChat\('biomarker_review', \{ biomarkerKey: key \}\);/,
  `onOpenAgentChat('biomarker_review', { biomarkerKey: key, prefillMessage: "Please review my biomarker: " + key });`
);
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mhtCode);

let htCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');
htCode = htCode.replace(
  /onOpenAgentChat\('biomarker_review', \{ biomarkerKey: key \}\);/,
  `onOpenAgentChat('biomarker_review', { biomarkerKey: key, prefillMessage: "Please review my biomarker: " + key });`
);
fs.writeFileSync('src/components/HomeTab.tsx', htCode);
