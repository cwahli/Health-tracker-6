import fs from 'fs';
import path from 'path';

let pass = 0;
let fail = 0;
function check(desc, cond) {
  if (cond) { console.log(`PASS: ${desc}`); pass++; }
  else { console.error(`FAIL: ${desc}`); fail++; }
}

const root = process.cwd();
const server = fs.readFileSync(path.join(root, 'server.ts'), 'utf-8');
const agg = fs.readFileSync(path.join(root, 'server_nutrient_aggregation.ts'), 'utf-8');
const brand = fs.readFileSync(path.join(root, 'serverBrandMenu.ts'), 'utf-8');

check('L1 label truthMatch includes sugarScaled / addedSugar from printed sugar',
  server.includes('sugarScaled') && server.includes("presentOrNull(['sugar'") &&
  server.includes('addedSugar: addedSugarScaled != null ? addedSugarScaled : sugarScaled'));

check('L2 LABEL_PROTECTED_NUTRIENT_KEYS blocks USDA macros on label truth',
  server.includes('LABEL_PROTECTED_NUTRIENT_KEYS') &&
  server.includes('isLabelTruth && LABEL_PROTECTED_NUTRIENT_KEYS.has(k)'));

check('L3 lockTruth loop skips already-locked keys',
  /if\s*\(\s*lockedNutrientKeys\.has\(k\)\s*\)\s*continue/.test(server) &&
  server.includes('CORE_FROM_NUTRIENTS_BLOCK'));

check('L4 label path uses _softMicros for non-core fill',
  server.includes('_softMicros') && server.includes('truthMatch._softMicros'));

check('L5 receipt LABEL before lookupCanonicalBaseFood hijack',
  server.includes("dbSourceUpper === 'LABEL'") &&
  server.includes('printed_packaging_label') &&
  server.includes('Prefer printed/brand truth for receipt attribution'));

check('L6 aggregateItemsNutrients applyTruthLocks after component sum',
  agg.includes('applyTruthLocks') && agg.includes('applyTruthLocks(itemNutrients)'));

check('L7 autoRegister forces per_100g for package 100g labels',
  brand.includes('ssLooksLikePackage100g') && brand.includes("basisType: 'per_100g'") &&
  !brand.includes("needsBasisFix ? { basis_type: 'per_dish'"));

check('L8 primaryBase100g addedSugar from locked truth / webAddedSugar',
  server.includes('webAddedSugar') && server.includes("lockedNutrientKeys.has('addedSugar')"));

console.log(`\nResults: ${pass} passed, ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
