const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

const startMarker = 'app.post("/api/gemini/health-baseline-analyze", async (req, res) => {';
const startIndex = serverTs.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find start marker');
  process.exit(1);
}

const endMarker = 'app.post("/api/gemini/route-biomarker", async (req, res) => {';
const endIndex = serverTs.indexOf(endMarker);
if (endIndex === -1) {
  console.error('Could not find end marker');
  process.exit(1);
}

const originalEndpoint = serverTs.substring(startIndex, endIndex);

let newEndpoint = `const healthBaselineAnalyzeSchema = {
  type: Type.OBJECT,
  properties: {
    report: {
      type: Type.OBJECT,
      properties: {
        _internalReasoning: { type: Type.STRING },
        globalSummary: { type: Type.STRING },
        timelineToOptimal: { type: Type.STRING },
        riskCategories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              categoryName: { type: Type.STRING },
              level: { type: Type.STRING },
              analysis: { type: Type.STRING },
              unaddressedRisk: { type: Type.STRING },
              biomarkerTargets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    targetValue: { type: Type.STRING }
                  },
                  required: ["name", "targetValue"]
                }
              },
              nutrientTargets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nutrientKey: { type: Type.STRING },
                    targetValue: { type: Type.STRING },
                    rationale: { type: Type.STRING }
                  },
                  required: ["nutrientKey", "targetValue", "rationale"]
                }
              },
              dailyActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    activity: { type: Type.STRING },
                    target: { type: Type.STRING }
                  },
                  required: ["activity", "target"]
                }
              }
            },
            required: ["categoryName", "level", "analysis", "unaddressedRisk", "biomarkerTargets", "nutrientTargets", "dailyActivities"]
          }
        },
        generalNutrientTargets: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.STRING },
            protein: { type: Type.STRING },
            totalFat: { type: Type.STRING },
            saturatedFat: { type: Type.STRING },
            transFat: { type: Type.STRING },
            unsaturatedFat: { type: Type.STRING },
            omega3: { type: Type.STRING },
            carbohydrates: { type: Type.STRING },
            addedSugar: { type: Type.STRING },
            totalFibre: { type: Type.STRING },
            solubleFibre: { type: Type.STRING },
            sodium: { type: Type.STRING },
            potassium: { type: Type.STRING },
            magnesium: { type: Type.STRING },
            calcium: { type: Type.STRING },
            iron: { type: Type.STRING },
            zinc: { type: Type.STRING },
            selenium: { type: Type.STRING },
            iodine: { type: Type.STRING },
            phosphorus: { type: Type.STRING },
            vitaminD: { type: Type.STRING },
            vitaminB12: { type: Type.STRING },
            folate: { type: Type.STRING },
            vitaminC: { type: Type.STRING },
            vitaminE: { type: Type.STRING },
            vitaminK: { type: Type.STRING },
            vitaminA: { type: Type.STRING },
            vitaminB6: { type: Type.STRING },
            thiamine: { type: Type.STRING },
            riboflavin: { type: Type.STRING },
            niacin: { type: Type.STRING }
          }
        }
      },
      required: ["_internalReasoning", "globalSummary", "timelineToOptimal", "riskCategories", "generalNutrientTargets"]
    }
  },
  required: ["report"]
};

app.post("/api/gemini/health-baseline-analyze", async (req, res) => {
  try {
    const isStream = req.query.stream === "true";
    if (isStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
    }

    const { profile, userProfile, biomarkerHistory, engine, refinement, calibratedInsights, outOfRangeBiomarkers } = req.body;
    const activeProfile = profile || userProfile || {};

    const sanitizedBiomarkerHistory = (biomarkerHistory || []).map((log: any) => {
      const clean = { ...log };
      delete clean.tests;
      delete clean.updated_at;
      delete clean.sync_state;
      delete clean.note;
      delete clean.summary;
      delete clean.id;
      return clean;
    });

    const riskGroupingsWithSeverity: Record<string, string[]> = {};
    const biomarkerHistories: Record<string, {date: string, val: any}[]> = {};
    
    // Sort by date descending so first seen is latest
    const parseDateStr = (dStr: string) => {
      if (!dStr) return 0;
      const parts = dStr.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(dStr).getTime();
        return new Date(\`\${parts[2]}-\${parts[1]}-\${parts[0]}\`).getTime();
      }
      return new Date(dStr).getTime();
    };

    const sortedHistory = [...sanitizedBiomarkerHistory].sort((a, b) => {
      return parseDateStr(b.date) - parseDateStr(a.date);
    });
    
    sortedHistory.forEach((log: any) => {
      if (log.biomarkers) {
        Object.keys(log.biomarkers).forEach(key => {
          if (!biomarkerHistories[key]) biomarkerHistories[key] = [];
          if (biomarkerHistories[key].length < 5) {
            biomarkerHistories[key].push({ date: log.date, val: log.biomarkers[key] });
          }
        });
      }
    });

    const normalBiomarkers: string[] = [];
    
    Object.keys(biomarkerHistories).forEach(key => {
      const history = biomarkerHistories[key];
      const latestVal = history[0].val;
      const historyStr = history.map(h => \`\\n       - \${h.date}: \${h.val}\`).join('');
      
      const outOfRangeDef = (outOfRangeBiomarkers || []).find((b: any) => b.key === key);
      
      if (outOfRangeDef) {
        const customDef = getCustomBiomarkerDef(activeProfile, key);
        const statusLabel = getBiomarkerStatusLabel(key, outOfRangeDef.status, customDef, latestVal, activeProfile);
        const def = biomarkerDefinitions.find(d => d.key === key);
        const calibrated = calibratedInsights?.[key];
        const medicalInsight = calibrated?.specificRiskContext || calibrated?.description || customDef?.specificRiskContext || customDef?.description || customDef?.benefitRisk || def?.benefitRisk;
        
        let medicalInsightStr = "";
        if (medicalInsight && medicalInsight !== "No specific medical insight defined.") {
          medicalInsightStr = \`\\n     Medical Insight: \${medicalInsight}\`;
        }

        const meta = getBiomarkerMetadata(key, customDef);
        // Map strictly to the most relevant single category
        const primaryRisk = meta.riskCategories && meta.riskCategories.length > 0 ? meta.riskCategories[0] : 'Systemic/General';
        
        const calibSource = customDef?.calibrationSource ? \` (Calibrated to: \${customDef.calibrationSource})\` : "";
        
        if (!riskGroupingsWithSeverity[primaryRisk]) riskGroupingsWithSeverity[primaryRisk] = [];
        riskGroupingsWithSeverity[primaryRisk].push(\`\${key} (Status: \${statusLabel})\${calibSource}\${historyStr}\${medicalInsightStr}\`);
      } else {
        normalBiomarkers.push(\`\${key}: \${latestVal}\`);
      }
    });

    let groupedRisksStr = "";
    if (Object.keys(riskGroupingsWithSeverity).length > 0) {
      groupedRisksStr = "Biomarkers at risk:\\n";
      Object.keys(riskGroupingsWithSeverity).forEach(risk => {
        groupedRisksStr += \`\\n[\${risk}]\\n\`;
        riskGroupingsWithSeverity[risk].forEach(line => {
          groupedRisksStr += \`  - \${line}\\n\`;
        });
      });
    }

    const biomarkerSummary = Object.keys(biomarkerHistories).length > 0 ? 
      \`\${groupedRisksStr}\\n\\nNormal/Uncategorized Biomarkers:\\n\${normalBiomarkers.join('\\n')}\` : 
      "No medical biomarkers logged.";

    const profileText = \`UserProfile: Age \${activeProfile.age || 'Not provided'}, Ethnicity: \${activeProfile.ethnicity || 'Not provided'}, Weight: \${activeProfile.weight || 'Not provided'}kg, Height: \${activeProfile.height || 'Not provided'}cm, Gender: \${activeProfile.gender || 'Not provided'}, Blood Type: \${activeProfile.bloodType || 'Not provided'}.\`;

    const promptText = \`Perform a comprehensive health baseline analysis using the totality of user information provided below. 

\${profileText}
\${biomarkerSummary}

=== AVAILABLE NUTRIENT KEYS ===
Core Nutrients: calories, solubleFibre, saturatedFat, protein, potassium, transFat, addedSugar, carbohydrates, totalFibre, sodium
Additional Nutrients: unsaturatedFat, omega3, magnesium, calcium, iron, zinc, selenium, iodine, phosphorus, vitaminD, vitaminB12, folate, vitaminC, vitaminE, vitaminK, vitaminA, vitaminB6, thiamine, riboflavin, niacin

=== CRITICAL REQUIREMENTS ===
1. **GLOBAL DEDUPLICATION LAW (ZERO REPETITION):** To ensure a clean, uncluttered user interface, every single entity must exist in exactly ONE risk category across the entire payload:
   - **Biomarkers:** If a biomarker (e.g., \\\`bmi\\\` or \\\`hba1c\\\`) is provided multiple times in the source data across different risk areas, isolate it. Map it strictly to the single most clinically relevant category. Do not repeat it in any other category's \\\`biomarkerTargets\\\` array.
   - **Activities:** If a daily activity (e.g., walking, hydration) provides cross-functional benefits to multiple health risks, do not duplicate or slightly reword it across categories. Assign it strictly to the single category where it serves as the most critical clinical countermeasure.
   - **Nutrients:** A high-leverage priority nutrient must only appear in one category's \\\`nutrientTargets\\\` array.

2. **PRIORITY NUTRIENT BUDGET (3 TO 6 TOTAL):** Across all combined \\\`riskCategories\\\` blocks, you must select a minimum of 3 and a maximum of 6 high-leverage therapeutic nutrients total to feature in the local \\\`nutrientTargets\\\` arrays. Follow the Clinical Triage Protocol (prioritizing absolute pathological drivers/ceilings like \\\`saturatedFat\\\` over minor optimization floors).

3. **GENERAL NUTRIENT TARGETS MAP:** You MUST populate all 31 keys in the flat, report-level \\\`generalNutrientTargets\\\` object with absolute baseline targets so the user has a full tracking profile. Use strict formatting operators:
   - Upper limits/ceilings: Use the '<' symbol (e.g., '< 15g').
   - Lower limits/floors: Use the '>' symbol (e.g., '> 25g').
   - Homeostatic ranges: Use a hyphen (e.g., '60g - 75g').
   Do not include text, rationales, or nested objects inside this map.

4. **TARGET PRECISION:** All values across the entire payload must be computed absolute amounts adjusted for the user's body weight and metrics (no percentage-only or relative g/kg outputs).\`;

    const systemInstruction = \`You are an evidence-based, pragmatic health coach and clinical analyst. Your goal is to translate complex health and longevity science into sustainable, low-friction daily habits and specific, personalized dietary targets based on the user's biometrics. Prioritize practical lifestyle adjustments, but provide precise, absolute macronutrient and micronutrient target values calculated using the user's weight and profile. Your response must be exactly one JSON object matching the requested schema. Never add markdown wrappers outside the JSON.\`;

    const textOutput = await callUnifiedLLM({
      modelId: (typeof engine === 'object' ? engine?.name || engine?.model : engine) || "gemini-3.5-flash-lite",
      systemInstruction,
      promptText,
      responseMimeType: "application/json",
      responseSchema: healthBaselineAnalyzeSchema,
      logStagePrefix: "health_coach",
      onStream: isStream ? (chunk: string, isThought?: boolean) => {
        if (isThought) {
          res.write(\`data: \${JSON.stringify({ type: 'stream', thought: chunk, stage: 'health_coach' })}\\n\\n\`);
        } else {
          res.write(\`data: \${JSON.stringify({ type: 'stream', chunk, stage: 'health_coach' })}\\n\\n\`);
        }
      } : undefined
    });

    let cleanJson = textOutput.replace(/\`\`\`(?:json)?/gi, "").trim();
    cleanJson = cleanJson.replace(/,\\s*([}\\]])/g, "$1");

    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      try {
        const firstBrace = cleanJson.indexOf("{");
        const lastBrace = cleanJson.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          parsedData = JSON.parse(extractBalancedJson(cleanJson));
        } else {
          throw parseErr;
        }
      } catch (innerErr) {
        console.error("[Health Baseline JSON Parse Error]:", innerErr, "\\nTruncated Output:", textOutput.substring(textOutput.length - 200));
        throw innerErr;
      }
    }

    if (parsedData._internalReasoning && !parsedData._internalReasoning) { parsedData._internalReasoning = parsedData._internalReasoning; }
    
    parsedData.agentPrompt = \`System Instruction:\\n\${systemInstruction}\\n\\n\${promptText}\`;
    
    if (isStream) {
      res.write(\`data: \${JSON.stringify({ final: true, result: {
        ...parsedData,
        apiCalls: [{ type: 'gemini', label: \`Health Baseline Agent (\${engine || 'gemini-3.5-flash-lite'})\` }]
      } })}\\n\\n\`);
      res.end();
    } else {
      res.json({
        ...parsedData,
        apiCalls: [{ type: 'gemini', label: \`Health Baseline Agent (\${engine || 'gemini-3.5-flash-lite'})\` }]
      });
    }
  } catch (error: any) {
    console.error("[Health Baseline Analyze Error]:", error);
    if (res.headersSent) {
      res.write(\`data: \${JSON.stringify({ error: "Failed to generate health baseline: " + error.message })}\\n\\n\`);
      res.end();
    } else {
      res.status(500).json({ error: "Failed to generate health baseline: " + error.message });
    }
  }
});
`;

serverTs = serverTs.substring(0, startIndex) + newEndpoint + serverTs.substring(endIndex);

fs.writeFileSync('server.ts', serverTs);
console.log('Replaced correctly');
