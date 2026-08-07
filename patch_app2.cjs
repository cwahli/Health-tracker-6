const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const globalNutrientTargets = Array\.isArray\(data\.nutrientTargets\)[\s\S]*?\} else if \(agentType === 'nutrition_general'\) \{/;

const match = regex.exec(code);
if (match) {
  console.log("Matched!");
  const replacement = `const generalNutrientTargets = data.generalNutrientTargets || {};

             if (!currentReport) {
               currentReport = {
                 timestamp: new Date().toISOString(),
                 dailyNutrientTargets: {},
                 mostImportantNextStep: '',
                 actions: [],
                 dailyBenefits: [],
                 latestInsights: [],
                 healthRiskForecast: { year5: '', year10: '', year20: '', optimized5: '', optimized10: '', optimized20: '' }
               };
             }

             let newDailyNutrientTargets = { ...(currentReport.dailyNutrientTargets || {}) };

             Object.entries(generalNutrientTargets).forEach(([key, val]) => {
               newDailyNutrientTargets[key] = String(val);
             });

             // Extract justified nutrient keys and activities from accepted categories
             acceptedCategories.forEach((cat: any) => {
               if (Array.isArray(cat.priorityNutrientTargets)) {
                 cat.priorityNutrientTargets.forEach((nt: any) => {
                   if (nt.nutrientKey && nt.targetValue) {
                     newDailyNutrientTargets[nt.nutrientKey] = nt.targetValue;
                   }
                 });
               }
               if (Array.isArray(cat.clinicalProtocols)) {
                 cat.clinicalProtocols.forEach((da: string) => {
                   if (da) {
                     const isStepActivity = /\\bsteps?\\b/i.test(da) || /\\bwalk(ing)?\\b/i.test(da);
                     if (isStepActivity) {
                       const stepsMatch = String(da).match(/[\\d,]+/);
                       if (stepsMatch) {
                         newDailyNutrientTargets.steps = stepsMatch[0].replace(/,/g, '');
                       }
                     } else {
                       currentDailyBenefits.push({
                         id: \`db_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                         activity: da,
                         target: "Daily",
                         completed: false
                       });
                     }
                   }
                 });
               }
             });

             currentReport.dailyNutrientTargets = newDailyNutrientTargets;
           } else if (agentType === 'nutrition_general') {`;

  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
} else {
  console.log("Not matched");
}
