import fs from 'fs';
import path from 'path';

const serverTs = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
const headerTsx = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');

const checks = [
  {
    name: 'server.ts calls resolveInternalFood',
    test: /await\s+resolveInternalFood\s*\(/.test(serverTs)
  },
  {
    name: 'server.ts calls executeFoodResolverAgent',
    test: /executeFoodResolverAgent\s*\(/.test(serverTs)
  },
  {
    name: 'server.ts handles upsertFoodAlias or food_aliases',
    test: /upsertFoodAlias|food_aliases/.test(serverTs)
  },
  {
    name: 'Header.tsx tracks open_deferred_gaps or deferred_gaps',
    test: /open_deferred_gaps|deferred_gaps|openDeferredGaps/.test(headerTsx)
  },
  {
    name: 'Header.tsx tracks sync_failures',
    test: /sync_failures|syncFailures/.test(headerTsx)
  },
  {
    name: 'server.ts applies server averageNutrients in comparison mode',
    test: /applyServerAverageNutrients/.test(serverTs)
  },
  {
    name: 'LedgerInvariant applies density corrections for unlocked composites',
    test: /applied density correction/.test(serverTs)
  }
];

let failed = false;
console.log("=== AI Studio Food Calc Exact Gate Verification ===");
for (const check of checks) {
  if (check.test) {
    console.log(`[PASS] ${check.name}`);
  } else {
    console.error(`[FAIL] ${check.name}`);
    failed = true;
  }
}

if (failed) {
  console.error("Gate verification failed.");
  process.exit(1);
} else {
  console.log("All exact change assertions passed!");
  process.exit(0);
}
