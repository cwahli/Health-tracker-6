import fs from 'fs';
let mcode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mcode = mcode.replace(/<ReviewBiomarkerModal[\s\S]*?setReviewingBiomarkerKey\(null\)\}\n\s*\/>/, '');
mcode = mcode.replace(/\{reviewingBiomarkerKey && \(\n\s*$/m, '');
mcode = mcode.replace(/^\s*\)\}\n/m, '');
mcode = mcode.replace(/<button[^>]*onClick=\{[^}]*setReviewingBiomarkerKey\([^}]*\}\s*>[\s\S]*?<\/button>/g, '');
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mcode);

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(/biomarkerKey: string,\n\s*/g, '');
fs.writeFileSync('src/App.tsx', appCode);
