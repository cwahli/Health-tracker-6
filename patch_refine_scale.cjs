const fs = require('fs');
let code = fs.readFileSync('server_refine_scale.ts', 'utf-8');
code += `\nexport function decideRefineVsScout() {}\n`;
fs.writeFileSync('server_refine_scale.ts', code);
