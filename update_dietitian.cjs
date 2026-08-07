const fs = require('fs');
let code = fs.readFileSync('agents/dietitianInstructions.ts', 'utf8');

const target1 = `export function buildModeAEditInstruction(context: {
  biomarkersNeedingImprovement?: any[];
  remainingAllowance?: any | null;
  activeMeal?: any;
}): string {
  const { biomarkersList, targetLimits } = formatPatientContext(context);
  const mealStr = context.activeMeal ? JSON.stringify(context.activeMeal, null, 2) : "None";

  return \`CURRENT_ACTIVE_MEAL_STATE: \${mealStr}

You are an expert clinical dietitian and nutritional LLM analyzer operating within an automated personalized health ecosystem. Output exactly ONE structured JSON object.

=== PATIENT CONTEXT PAYLOAD ===
CRITICAL PATIENT BIOMARKER WARNINGS & NUTRITIONAL DIRECTIVES:
\${biomarkersList}
\${targetLimits}

=== UNIVERSAL HEALTH DIRECTIVE ===
TRANS FAT AVOIDANCE: Trans fat is universally harmful. Always flag any food likely to contain trans fats in "risks".

=== DATA EXTRACTION DEPTH RULES ===
1. CORE NUTRIENTS: Use databaseMatches to extract raw authentic data. You MUST ONLY use exactly the IDs provided in the [Database Matches Context]. DO NOT invent or hallucinate IDs. If no reasonable match is found in the context, output "estimated" for dbSource and null for dbId.
2. TRACE NUTRIENTS: Output the single most appropriate foodType string for each item (e.g., 'red_meat', 'leafy_veg', 'fruit', 'dairy', 'ultra_processed').

=== SAUCES VS SPICES DIRECTIVE ===
You must differentiate between dry spices (like 'black pepper') and liquid sauces (like 'black pepper sauce'). If a food item has a sauce, include the full sauce name as an item component.

=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ===`;

const replace1 = target1.replace(
  "=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ===",
  "=== PERSONALIZED INSIGHT DIRECTIVE (CRITICAL) ===\nThe patient already knows their own biomarker results, profile, and medical conditions — do NOT restate them back to the patient verbatim. Use them silently to inform your judgment only.\nIn \"message\", give forward-looking, specific, actionable insight referencing this food's numbers against today's target and any multi-day trend data present in the prompt, ending with ONE concrete next step. Keep it concise: 2-4 sentences maximum.\n\n=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ==="
);

code = code.replace(target1, replace1);

const target2 = `"message": "Updated clinical assessment reflecting the weight change.",`;
const replace2 = `"message": "Forward-looking, personalized insight reflecting the change — how the updated meal fits today's target and the recent trend, plus ONE concrete next step. Do not restate known biomarker/profile facts.",`;

// Ensure we only replace the one in buildModeAEditInstruction (after it)
// we'll split at target1 and replace only in the second part
const parts = code.split("=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ===");
if (parts.length > 2) {
  parts[2] = parts[2].replace(target2, replace2); // since we already replaced the first part, the second one is parts[2]
}

fs.writeFileSync('agents/dietitianInstructions.ts', parts.join("=== ACTIVE TASK: ACTIVE MEAL UPDATE / REASSESSMENT ==="), 'utf8');
console.log("Done");
