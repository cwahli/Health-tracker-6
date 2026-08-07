import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/biomarkerKey\?: string;\n\s*biomarkerKey\?: string;/g, 'biomarkerKey?: string;');
fs.writeFileSync('src/App.tsx', code);
