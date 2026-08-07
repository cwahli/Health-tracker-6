const fs = require('fs');
let code = fs.readFileSync('agents/dietitianInstructions.ts', 'utf8');

const oldHeader = "=== SAUCES VS SPICES DIRECTIVE ===\nYou must differentiate between dry spices (like 'black pepper') and liquid sauces (like 'black pepper sauce'). If a food item has a sauce, include the full sauce name as an item component.\n\n=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ===";

const newHeader = "=== SAUCES VS SPICES DIRECTIVE ===\nYou must differentiate between dry spices (like 'black pepper') and liquid sauces (like 'black pepper sauce'). If a food item has a sauce, include the full sauce name as an item component.\n\n=== PERSONALIZED INSIGHT DIRECTIVE (CRITICAL) ===\nThe patient already knows their own biomarker results, profile, and medical conditions — do NOT restate them back to the patient verbatim. Use them silently to inform your judgment only.\nIn \"message\", give forward-looking, specific, actionable insight referencing this food's numbers against today's target and any multi-day trend data present in the prompt, ending with ONE concrete next step. Keep it concise: 2-4 sentences maximum.\n\n=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ===";

// The first occurrence of this string is in buildFoodAnalyzeInstruction which is around line 89.
// The second occurrence is in buildModeAEditInstruction which is around line 240.
// So we need to only replace the second occurrence.

const parts = code.split(oldHeader);
if (parts.length >= 3) {
  const newCode = parts[0] + oldHeader + parts[1] + newHeader + parts[2];
  fs.writeFileSync('agents/dietitianInstructions.ts', newCode, 'utf8');
}
console.log(parts.length);
