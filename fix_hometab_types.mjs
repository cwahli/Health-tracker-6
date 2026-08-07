import fs from 'fs';

let hCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');
hCode = hCode.replace(
  /options\?: \{ prefillMessage\?: string; dataReviewBatchKeys\?: string\[\]; dataReviewBatchIdx\?: number \| string; autoSendMessage\?: string \}/g,
  `options?: { prefillMessage?: string; dataReviewBatchKeys?: string[]; dataReviewBatchIdx?: number | string; autoSendMessage?: string; biomarkerKey?: string }`
);
fs.writeFileSync('src/components/HomeTab.tsx', hCode);

let mCode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mCode = mCode.replace(
  /options\?: \{ prefillMessage\?: string; dataReviewBatchKeys\?: string\[\]; dataReviewBatchIdx\?: number \| string \}/g,
  `options?: { prefillMessage?: string; dataReviewBatchKeys?: string[]; dataReviewBatchIdx?: number | string; biomarkerKey?: string }`
);
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mCode);

