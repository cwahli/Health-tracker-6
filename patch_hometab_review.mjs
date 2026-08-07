import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

code = code.replace(
  /onOpenAiReview=\{setReviewingBiomarkerKey\}/,
  `onOpenAiReview={(key) => {
                                        if (onOpenAgentChat) {
                                          onOpenAgentChat('biomarker_review', { biomarkerKey: key });
                                        }
                                      }}`
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
