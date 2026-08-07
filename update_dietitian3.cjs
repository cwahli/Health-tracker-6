const fs = require('fs');
let code = fs.readFileSync('agents/dietitianInstructions.ts', 'utf8');

const oldMsg = `"message": "Updated clinical assessment reflecting the weight change.",`;
const newMsg = `"message": "Forward-looking, personalized insight reflecting the change — how the updated meal fits today's target and the recent trend, plus ONE concrete next step. Do not restate known biomarker/profile facts.",`;

const parts = code.split(oldMsg);
if (parts.length >= 3) {
  const newCode = parts[0] + oldMsg + parts[1] + newMsg + parts[2];
  fs.writeFileSync('agents/dietitianInstructions.ts', newCode, 'utf8');
}
console.log(parts.length);
