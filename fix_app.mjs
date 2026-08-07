import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/setActiveReviewBiomarkerKey\(options\?\.biomarkerKey\);\n/g, '');
fs.writeFileSync('src/App.tsx', code);
