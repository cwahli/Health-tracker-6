import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function check(desc, cond) {
  if (cond) { console.log(`PASS: ${desc}`); pass++; }
  else { console.error(`FAIL: ${desc}`); fail++; }
}

const root = process.cwd();
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8');
const sync = fs.readFileSync(path.join(root, 'src/utils/syncUtils.ts'), 'utf-8');
const auth = fs.readFileSync(path.join(root, 'src/components/AuthScreen.tsx'), 'utf-8');

// G1
check('G1 mergeProfiles pins email local-preferring',
  /email:\s*localProfile\?\.email\s*\|\|\s*primary\.email\s*\|\|\s*cloudProfile\?\.email/.test(sync));

// G2
check('G2 sanitizeProfile treats john@ / john doe',
  /function sanitizeProfile\(/.test(app) &&
  app.includes('john@mail') &&
  app.includes('john doe'));
check('G2 sanitizeProfile empty admin path not bare null-only',
  /function sanitizeProfile[\s\S]{0,1000}if\s*\(\s*!incomingProfile\s*\)[\s\S]{0,500}C\. Liu/.test(app));

// G3
check('G3 empty-cloud path uses sanitizeProfile(localProfile',
  app.includes('setProfile(sanitizeProfile(localProfile'));
check('G3 demo bootstrap uses demo@healthcockpit.com not john@mail',
  app.includes("demo@healthcockpit.com") &&
  !/isDemoUser\s*=\s*auth\.currentUser\?\.email\?\.toLowerCase\(\)\s*===\s*'john@mail\.com'/.test(app));

// G4
check('G4 password admin nickname is C. Liu',
  auth.includes("nickname: 'C. Liu'") &&
  !auth.includes("nickname: 'Chiwah (Admin)'"));

// G5
check('G5 App onAuthStateChanged purges john@',
  /onAuthStateChanged\(auth,\s*async\s*\(user\)\s*=>\s*\{[\s\S]{0,1000}john@mail\.com[\s\S]{0,500}fbSignOut/.test(app));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
