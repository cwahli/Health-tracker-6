const fs = require('fs');
let code = fs.readFileSync('src/components/PortionClarifyCard.tsx', 'utf-8');
code = code.replace('export default function PortionClarifyCard', 'export function PortionClarifyCard');
fs.writeFileSync('src/components/PortionClarifyCard.tsx', code);
