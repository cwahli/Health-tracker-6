const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const schemaRegex = /const healthBaselineAnalyzeSchema = \{[\s\S]*?required: \["report"\]\n\};/;
const newSchema = `const healthBaselineAnalyzeSchema = {
  type: Type.OBJECT,
  properties: {
    report: {
      type: Type.OBJECT,
      properties: {
        timelineToOptimal: {
          type: Type.STRING,
          description: "The overall hard physiological timeline paired with user-perception benchmarks (e.g., sleep depth, waist trimming, puffiness reduction)."
        },
        riskCategories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              categoryName: { type: Type.STRING },
              level: { type: Type.STRING, enum: ["Low", "Moderate", "Elevated", "High"] },
              targetTrajectory: {
                type: Type.STRING,
                description: "Explains the concrete physical value of getting these specific biomarkers to target, what physical signs will improve, and the timeline speed for this specific category."
              },
              priorityNutrientTargets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nutrientKey: { type: Type.STRING },
                    targetValue: { type: Type.STRING },
                    rationale: { 
                      type: Type.STRING, 
                      description: "Mechanistic and precise explanation of why this target/amount was chosen, detailing the level of commitment (e.g., exact caloric deficit size and safe weight loss velocity per week)."
                    }
                  },
                  required: ["nutrientKey", "targetValue", "rationale"]
                }
              },
              clinicalProtocols: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Precise, time-bound behavioral or physical rules to implement daily."
              }
            },
            required: ["categoryName", "level", "targetTrajectory", "priorityNutrientTargets", "clinicalProtocols"]
          }
        },
        generalNutrientTargets: {
          type: Type.OBJECT,
          description: "A flat map containing all 31 available nutrient keys populated with precise formatted values."
        }
      },
      required: ["timelineToOptimal", "riskCategories", "generalNutrientTargets"]
    }
  },
  required: ["report"]
};`;

code = code.replace(schemaRegex, newSchema);

const promptReplacementStart = `    const promptText = \`Perform a comprehensive health baseline analysis using the totality of user information provided below. \n\n\${profileText}\n\${biomarkerSummary}`;
const promptReplacementEnd = `\`;\n\n    const systemInstruction = \`You are an evidence-based, pragmatic health coach and clinical analyst. Your goal is to translate complex health and longevity science into sustainable, low-friction daily habits and specific, personalized dietary targets based on the user's biometrics. Prioritize practical lifestyle adjustments, but provide precise, absolute macronutrient and micronutrient target values calculated using the user's weight and profile.\n\nCRITICAL DATA INTEGRITY LAW: You MUST NOT create clinical risk categories, target values, or dietary interventions for any biomarker listed under [FLAGGED / UNRESOLVED TELEMETRY ERRORS]. Ignore flagged data and focus exclusively on valid clinical biometrics.\n\nYour response must be exactly one JSON object matching the requested schema. Never add markdown wrappers outside the JSON.\`;`;

// the regex to replace everything from promptText up to systemInstruction end
const textRegex = /const promptText = `Perform a comprehensive health baseline analysis using the totality of user information provided below\. [\s\S]*?Your response must be exactly one JSON object matching the requested schema\. Never add markdown wrappers outside the JSON\.`;/;

const newPromptCode = `const promptText = \`Perform a comprehensive health baseline analysis using the totality of user information provided below. 

\${profileText}
\${biomarkerSummary}

=== AVAILABLE NUTRIENT KEYS ===
Core Nutrients: calories, totalFat, solubleFibre, saturatedFat, protein, potassium, transFat, addedSugar, carbohydrates, totalFibre, sodium
Additional Nutrients: unsaturatedFat, omega3, magnesium, calcium, iron, zinc, selenium, iodine, phosphorus, vitaminD, vitaminB12, folate, vitaminC, vitaminE, vitaminK, vitaminA, vitaminB6, thiamine, riboflavin, niacin

=== ZERO-REDUNDANCY LAW ===
1. **Single-Source Information:** Every clinical insight, priority nutrient rationale, or protocol must exist in exactly ONE location within the JSON payload.
2. **Scrap Global Lists:** Do not generate trailing summary bullet points, master nutrient lists, or global action plan texts at the base of the document. Embed every high-leverage nutrient explanation cleanly and exclusively within its corresponding clinical category block.
3. **No Echoing:** Do not create separate arrays or blocks to echo raw baseline biomarker numbers or target thresholds that the user interface already knows. Focus entirely on synthesis, strategy, and biological trends.

=== TARGET PRECISION ===
All values across the entire payload — including \\\`nutrientTargets[].targetValue\\\` and \\\`generalNutrientTargets\\\` — MUST carry formatting operators (<, >, <=, >=, or range -) and appropriate units. For zero-baseline symptom scores or indices, express targets as "< 1" or "<= 0".\`;

    const systemInstruction = \`1. Core Persona & Tone Law
Objective Clinical Authority: You are an objective, data-first clinical analyst. Avoid casual, chatty, or overly familiar health-coach language.
Anti-Gimmick Rule: Do not write retrospective, hyper-specific diary callouts (e.g., "I see you ate a salad on Tuesday" or "Avoid the pizza you had yesterday"). This feels artificial and out of touch. Address the long-term, overarching metabolic and physiological trends of the entire profile.

2. User Perception & Symptom Mapping Instruction
Tangible Prognosis: When defining timelines and target trajectories, translate internal blood chemistry shifts into concrete, real-world physical changes the user can physically feel and observe.
Symptom Linkage:
- Link Visceral Adiposity/BMI reduction directly to visible waistline trimming, reduced internal airway pressure, deeper sleep, and decreased snoring.
- Link eGFR and Fluid Balance optimization directly to the clearance of chronic, subtle morning fluid retention (such as facial or ankle puffiness) and increased physical freshness.
- Link Lipid and Cardiovascular optimization directly to unburdened physical stamina, easier recovery, and preserved endurance during standard daily physical tasks.

3. Nutrient Target Precision & Rate of Progress
Commitment Definitions: For dynamic macro-levers (e.g., calories), do not just provide an absolute number. You must explicitly calculate and state the exact biological pace inside the rationale. Specify a gentle, sustainable energy deficit (e.g., ~250 kcal/day) targeting a safe, permanent weight loss velocity (e.g., 0.25 kg per week) over a 12-month horizon to fully protect skeletal muscle mass.
Mechanistic Clarity: Explain precisely how a nutrient target shifts a biomarker (e.g., explaining that restricting saturated fat downregulates hepatic cholesterol production by withholding raw materials, or that soluble fiber binds intestinal bile acids to force excretion).

4. The 31-Nutrient Mechanism & Overrides
Deterministic Baselines: For the 15 static micronutrients (vitaminA, vitaminC, vitaminD, vitaminE, vitaminK, vitaminB12, vitaminB6, thiamine, riboflavin, niacin, folate, zinc, selenium, iodine, magnesium), output standard, medically accepted Age/Gender RDAs by default inside the generalNutrientTargets block.
Clinical Escape Hatch: You MUST dynamically alter or override these static baselines if a specific out-of-range clinical biomarker demands it (e.g., elevating Vitamin C to maximize plant-based iron absorption during hematocrit drops, or modifying calcium/phosphorus parameters if eGFR metrics indicate advanced filtration stress).

CRITICAL DATA INTEGRITY LAW: You MUST NOT create clinical risk categories, target values, or dietary interventions for any biomarker listed under [FLAGGED / UNRESOLVED TELEMETRY ERRORS]. Ignore flagged data and focus exclusively on valid clinical biometrics.

Your response must be exactly one JSON object matching the requested schema. Never add markdown wrappers outside the JSON.\`;`;

code = code.replace(textRegex, newPromptCode);

fs.writeFileSync('server.ts', code);
