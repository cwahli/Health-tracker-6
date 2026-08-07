import fs from 'fs';
import path from 'path';

const serverTs = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
const catalogTs = fs.readFileSync(path.join(process.cwd(), 'server_food_catalog.ts'), 'utf8');
const headerTsx = fs.readFileSync(path.join(process.cwd(), 'src/components/Header.tsx'), 'utf8');
const foodResolverInstructions = fs.readFileSync(path.join(process.cwd(), 'agents/foodResolverInstructions.ts'), 'utf8');

const checks = [
  {
    name: '1. server.ts calls resolveInternalFood',
    test: /await\s+resolveInternalFood\s*\(/.test(serverTs)
  },
  {
    name: '2. server.ts handles upsertFoodAlias',
    test: /upsertFoodAlias/.test(serverTs)
  },
  {
    name: '3. server.ts calls applyServerAverageNutrients',
    test: /applyServerAverageNutrients/.test(serverTs)
  },
  {
    name: '4. server.ts contains density correction log',
    test: /applied density correction/.test(serverTs)
  },
  {
    name: '5. server.ts contains IncompleteAssembly',
    test: /IncompleteAssembly/.test(serverTs)
  },
  {
    name: '6. server.ts contains unassigned indices log',
    test: /unassigned indices/.test(serverTs)
  },
  {
    name: '7. Header.tsx tracks open_deferred_gaps and sync_failures',
    test: /open_deferred_gaps/.test(headerTsx) && /sync_failures/.test(headerTsx)
  },
  {
    name: '8. server.ts metrics route does not sum candidate + active directly for resolver_call_count',
    test: !/resolver_call_count:\s*status\.food_items\?\.candidate\s*\+\s*status\.food_items\?\.active/.test(serverTs)
  },
  {
    name: '9. foodResolverInstructions contains bar/snack-bar vs cup/bowl rules',
    test: /bar|snack-bar/.test(foodResolverInstructions) && /cup|bowl|yogurt/.test(foodResolverInstructions)
  },
  {
    name: '10. server.ts uses category_fallback or category fallback',
    test: /category_fallback|category fallback/.test(serverTs)
  },
  {
    name: '11. resolveInternalFood path allows candidate OR immediate active promote exists',
    test: /candidate/.test(catalogTs) || /auto_promote|status:\s*['"]active['"]/.test(catalogTs)
  }
];

let failed = false;
console.log("=== AI Studio Food Calc Final Gate Verification ===");
for (const check of checks) {
  if (check.test) {
    console.log(`[PASS] ${check.name}`);
  } else {
    console.error(`[FAIL] ${check.name}`);
    failed = true;
  }
}

if (failed) {
  console.error("Final gate verification failed.");
  process.exit(1);
} else {
  console.log("All final change assertions passed successfully!");
  process.exit(0);
}
