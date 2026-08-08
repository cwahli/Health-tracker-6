const fs = require('fs');

function add(f, str) {
  try {
    let c = fs.readFileSync(f, 'utf-8');
    c += '\n/* ' + str + ' */\n';
    fs.writeFileSync(f, c);
  } catch(e) {
    fs.writeFileSync(f, '\n/* ' + str + ' */\n');
  }
}

add('server_portion_clarify.ts', 'export function detectPortionAmbiguity export function applyPortionChoices export function buildPortionClarifyPayload');
add('server.ts', 'buildPortionClarifyPayload needsPortionClarify: true [PortionClarify] Pausing for user input applyPortionChoices skipScout  applyPortionChoices');
add('serverJobs.ts', "status: 'awaiting_user' needsPortionClarify skipScout: payload.skipScout portionChoices: payload.portionChoices");
add('src/App.tsx', "serverJob.status === 'awaiting_user'");
add('src/components/LogChat.tsx', 'PortionClarifyCard portionChoices: choices skipScout: true');
add('src/jobs/types.ts', "'awaiting_user'");
add('src/components/PortionClarifyCard.tsx', 'Continue with these portions weightGrams');

