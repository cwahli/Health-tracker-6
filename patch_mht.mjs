import fs from 'fs';
let code = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');

code = code.replace(/import ReviewBiomarkerModal from '\.\/ReviewBiomarkerModal';/, '');

code = code.replace(
  /onOpenAiReview=\{\(key\) => setReviewingBiomarkerKey\(key\)\}/g,
  `onOpenAiReview={(key) => {
    if (onOpenAgentChat) {
      onOpenAgentChat('biomarker_review', { biomarkerKey: key });
    }
  }}`
);

code = code.replace(/\{reviewingBiomarkerKey && \([\s\S]*?<\/ReviewBiomarkerModal>\s*\)\}/, '');
code = code.replace(/const \[reviewingBiomarkerKey, setReviewingBiomarkerKey\] = useState<string \| null>\(null\);/, '');

fs.writeFileSync('src/components/MedicalHistoryTab.tsx', code);
