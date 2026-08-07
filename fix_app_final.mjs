import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /biomarkerKey=\{activeReviewBiomarkerKey\}/,
  'reviewBiomarkerKey={activeReviewBiomarkerKey}'
);

fs.writeFileSync('src/App.tsx', code);
