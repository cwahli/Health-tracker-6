import fs from 'fs';

// Fix App.tsx biomarkerKey
let aCode = fs.readFileSync('src/App.tsx', 'utf-8');
aCode = aCode.replace(/biomarkerKey:\s*[^,]+,/g, '');
fs.writeFileSync('src/App.tsx', aCode);

// Fix MedicalHistoryTab
let mCode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mCode = mCode.replace(/\{reviewingBiomarkerKey && \([\s\S]*?<ReviewBiomarkerModal[\s\S]*?\/>\s*\)\}/, '');
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mCode);

