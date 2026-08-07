import fs from 'fs';
let code = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');

code = code.replace(
  /onOpenAiReview=\{.*?\}\s*onCombineBiomarker/,
  `onOpenAiReview={(key) => {
                                if (onOpenAgentChat) onOpenAgentChat('biomarker_review', { biomarkerKey: key });
                              }} onCombineBiomarker`
);

fs.writeFileSync('src/components/MedicalHistoryTab.tsx', code);
