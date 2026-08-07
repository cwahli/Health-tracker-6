import fs from 'fs';
let code = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
const lines = code.split('\n');
lines.splice(685, 0, '                  )}');
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', lines.join('\n'));
