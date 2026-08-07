import fs from 'fs';
let hCode = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');
hCode = hCode.replace(/\{\s*\/\* AI Review Modal for Biomarker details \*\/\s*\}/g, '');
hCode = hCode.replace(/\{reviewingBiomarkerKey && \([\s\S]*?\)\}/g, '');
fs.writeFileSync('src/components/HomeTab.tsx', hCode);
