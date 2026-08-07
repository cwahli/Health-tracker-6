const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldSchemaStr = `    const healthPlanningSchema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "Executive clinical summary synthesizing diagnostic accuracy, external confounding variables, and short vs long-term health planning recommendations." },
        retestBiomarkers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING, description: "Biomarker key or slugified name" },
              name: { type: Type.STRING, description: "Clean display name (e.g. Fasting Glucose)" },
              currentValue: { type: Type.STRING, description: "Current value or 'Not tested'" },
              unit: { type: Type.STRING, description: "Measurement unit" },
              retestTimeframe: { type: Type.STRING, description: "Recommended retest timeframe (e.g. In 2-4 weeks)" },
              isProvisional: { type: Type.BOOLEAN, description: "Whether reading should be considered provisional due to external factors" },
              priority: { type: Type.STRING, enum: ["high", "medium", "low"], description: "Priority level based on physiological severity or urgency" },
              reason: { type: Type.STRING, description: "Detailed clinical rationale explaining potential confounding variables or reason for retest, combined with a clear explanation of why this priority level was assigned." }
            },
            required: ["name", "retestTimeframe", "isProvisional", "priority", "reason"]
          }
        },
        testingGaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              testName: { type: Type.STRING, description: "Name of recommended test (existing or new unentered biomarker)" },
              category: { type: Type.STRING, enum: ["short_term", "long_term"], description: "short_term (< 2 years) or long_term (>= 2 years)" },
              timeframe: { type: Type.STRING, description: "Recommended timeframe (e.g. Within 3 months)" },
              priority: { type: Type.STRING, enum: ["high", "medium", "low"], description: "Priority level based on physiological risk or necessity" },
              reason: { type: Type.STRING, description: "Detailed clinical rationale explaining why this test uncovers hidden profile risks, combined with a clear explanation of why this priority level was assigned." },
              targetCondition: { type: Type.STRING, description: "Target condition or physiological system" }
            },
            required: ["testName", "category", "timeframe", "priority", "reason", "targetCondition"]
          }
        }
      },
      required: ["summary", "retestBiomarkers", "testingGaps"]
    };`;

const newSchemaStr = `    const healthPlanningSchema = {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING, description: "A brief, conversational greeting directly addressing the user." },
        _internalReasoning: { type: Type.STRING, description: "Step-by-step clinical deduction and date calculation logic." },
        summary: { type: Type.STRING, description: "Executive clinical summary synthesizing diagnostic findings and risk trends." },
        retestBiomarkers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Display name of the biomarker" },
              recommendedTestName: { type: Type.STRING, description: "The precise, standard clinical lab order name (e.g., 'Hepatic Function Panel')" },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Priority level" },
              retestTimeframe: { type: Type.STRING, description: "The interval (e.g., '3 months')" },
              lastTestedDate: { type: Type.STRING, description: "Exact date this was last tested (Format: DD-MM-YYYY)" },
              nextScheduledDate: { type: Type.STRING, description: "Exact calculated date for the next test (Format: DD-MM-YYYY)" },
              userBenefit: { type: Type.STRING, description: "Explain why retesting this provides value, energy, or peace of mind to the user." },
              gpClinicalJustification: { type: Type.STRING, description: "The objective medical rationale for the GP to justify the lab order." },
              key: { type: Type.STRING, description: "biomarker_database_key" },
              currentValue: { type: Type.STRING, description: "value and unit" },
              unit: { type: Type.STRING, description: "unit" }
            },
            required: ["name", "recommendedTestName", "priority", "retestTimeframe", "lastTestedDate", "nextScheduledDate", "userBenefit", "gpClinicalJustification", "key"]
          }
        },
        testingGaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              testName: { type: Type.STRING, description: "Name of the missing scan or lab (e.g., 'Abdominal Ultrasound')" },
              category: { type: Type.STRING, enum: ["short_term", "long_term"], description: "short_term (< 2 years) or long_term (>= 2 years)" },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"], description: "Priority level" },
              nextScheduledDate: { type: Type.STRING, description: "Exact date by which this should be completed (Format: DD-MM-YYYY)" },
              targetCondition: { type: Type.STRING, description: "The disease or condition being ruled out" },
              userBenefit: { type: Type.STRING, description: "Explanation of why uncovering this missing data will improve their life or treatment plan." },
              gpClinicalJustification: { type: Type.STRING, description: "The objective medical rationale for the GP." }
            },
            required: ["testName", "category", "priority", "nextScheduledDate", "targetCondition", "userBenefit", "gpClinicalJustification"]
          }
        },
        mode: { type: Type.STRING, description: "discussion" },
        status: { type: Type.STRING, description: "active" }
      },
      required: ["text", "_internalReasoning", "summary", "retestBiomarkers", "testingGaps", "mode", "status"]
    };`;

code = code.replace(oldSchemaStr, newSchemaStr);
fs.writeFileSync('server.ts', code);
