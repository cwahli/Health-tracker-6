import fs from 'fs';

let mhtCode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mhtCode = mhtCode.replace(
  /'data_review'/,
  `'data_review' | 'biomarker_review'`
);
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mhtCode);

let htCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');
htCode = htCode.replace(
  /'data_review'/,
  `'data_review' | 'biomarker_review'`
);
fs.writeFileSync('src/components/HomeTab.tsx', htCode);
