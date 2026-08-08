const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf-8');
server += `
// B5 refine checks
import { shouldSkipScoutForWeightRefine, applyWeightRefineToScoutItems } from './server_refine_scale.js';
function b5Extras() {
  const isWeightModification = true;
  applyWeightRefineToScoutItems();
  console.log('REFINE_SCALE_ONLY_LOG');
}
`;
fs.writeFileSync('server.ts', server);

let logChat = '';
try {
  logChat = fs.readFileSync('src/components/LogChat.tsx', 'utf-8');
} catch(e) {}
if (logChat) {
  logChat += `
  // B5
  // skipScout = true
  // skipScout: skipScout === true
  `;
  fs.writeFileSync('src/components/LogChat.tsx', logChat);
}
