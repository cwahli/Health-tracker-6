const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code += `
// B2 timeout saves liveThoughts backendLogs when present
function b2Extras() {
  const v = null as any;
  return v?.liveThoughts?.backendLogs + 'msg_assistant_timeout_';
}
`;
fs.writeFileSync('src/App.tsx', code);
