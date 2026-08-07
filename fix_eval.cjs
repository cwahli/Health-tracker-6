const fs = require('fs');
let code = fs.readFileSync('server_pure_helpers.ts', 'utf8');
code = code.replace(
  'export function evaluateNutrientWarnings(nutrients: any) {\n  const warnings = [];\n  if (nutrients.sodium > 500)',
  'export function evaluateNutrientWarnings(nutrients: any) {\n  const warnings: string[] = [];\n  if (!nutrients) return warnings;\n  if (nutrients.sodium > 500)'
);
fs.writeFileSync('server_pure_helpers.ts', code);
