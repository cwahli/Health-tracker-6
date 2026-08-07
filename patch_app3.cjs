const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `           } else if (agentType === 'health_baseline') {
             setIsMedicalChatOpen(false);
             const data = agentResult?.report || agentResult || {};
             const unselected = new Set(agentResult.unselectedRowKeys || []);
             const riskCategories = Array.isArray(data.riskCategories) ? data.riskCategories : [];
             const acceptedCategories = riskCategories.filter((_: any, idx: number) => !unselected.has(idx));
             
             const globalNutrientTargets = Array.isArray(data.nutrientTargets) ? data.nutrientTargets : (Array.isArray(data.topNutrientTargets) ? data.topNutrientTargets : []);
             const globalDailyActivities = Array.isArray(data.dailyActivities) ? data.dailyActivities : [];
             const generalNutrientTargets = data.generalNutrientTargets || {};

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
             const justifiedNutrientKeys = new Set();
             const justifiedActivities = new Set();

             acceptedCategories.forEach((cat) => {
               if (Array.isArray(cat.nutrientTargets)) {
                 cat.nutrientTargets.forEach((nt) => {
                   if (nt.nutrientKey) {
                     justifiedNutrientKeys.add(nt.nutrientKey.toLowerCase().trim());
                   }
                 });
               }
               if (Array.isArray(cat.dailyActivities)) {
                 cat.dailyActivities.forEach((da) => {
                   if (da.activity) {
                     justifiedActivities.add(da.activity.toLowerCase().trim());
                   }
                 });
               }
             });

             globalNutrientTargets.forEach((nt: any) => {
               if (nt.nutrientKey && nt.targetValue) {
                 newDailyNutrientTargets[nt.nutrientKey] = nt.targetValue;
               }
             });

             globalDailyActivities.forEach((da: any) => {
               if (da.activity && da.target && justifiedActivities.has(da.activity.toLowerCase().trim())) {
                 const isStepActivity = /\\bsteps?\\b/i.test(da.activity) || /\\bwalk(ing)?\\b/i.test(da.activity);
                 if (isStepActivity) {
                   const stepsMatch = String(da.target).match(/[\\d,]+/);
                   if (stepsMatch) {
                     newDailyNutrientTargets.steps = stepsMatch[0].replace(/,/g, '');
                   }
                 } else {
                   currentDailyBenefits.push({
                     id: \`db_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                     activity: da.activity,
                     target: da.target,
                     completed: false
                   });
                 }
               }
             });

             acceptedCategories.forEach((cat: any) => {
               if (Array.isArray(cat.nutrientTargets)) {
                 cat.nutrientTargets.forEach((nt: any) => {
                   if (nt.nutrientKey && nt.targetValue) {
                     newDailyNutrientTargets[nt.nutrientKey] = nt.targetValue;
                   }
                 });
               }
               if (Array.isArray(cat.dailyActivities)) {
                 cat.dailyActivities.forEach((da: any) => {
                   if (da.activity && da.target) {
                     const isStepActivity = /\\bsteps?\\b/i.test(da.activity) || /\\bwalk(ing)?\\b/i.test(da.activity);
                     if (isStepActivity) {
                       const stepsMatch = String(da.target).match(/[\\d,]+/);
                       if (stepsMatch) {
                         newDailyNutrientTargets.steps = stepsMatch[0].replace(/,/g, '');
                       }
                     } else {
                       currentDailyBenefits.push({
                         id: \`db_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                         activity: da.activity,
                         target: da.target,
                         completed: false
                       });
                     }
                   }
                 });
               }
             });

             currentReport.dailyNutrientTargets = newDailyNutrientTargets;

             const recommendedKeysSet = new Set<string>();
             if (Array.isArray(data.topNutrientTargets)) {
               data.topNutrientTargets.forEach((nt: any) => {
                 const k = typeof nt === 'string' ? nt : (nt?.nutrientKey || nt?.key);
                 if (k) recommendedKeysSet.add(k);
               });
             }
             const rawWeeklyData = data.topWeeklyNutrientTargets || data.weeklyNutrientTargets;
             if (Array.isArray(rawWeeklyData)) {
               rawWeeklyData.forEach((nt: any) => {
                 const k = typeof nt === 'string' ? nt : (nt?.nutrientKey || nt?.key);
                 if (k) recommendedKeysSet.add(k);
               });
             } else if (typeof rawWeeklyData === 'object' && rawWeeklyData !== null) {
               Object.keys(rawWeeklyData).forEach(k => recommendedKeysSet.add(k));
             }
             acceptedCategories.forEach((cat: any) => {
               if (Array.isArray(cat.nutrientTargets)) {
                 cat.nutrientTargets.forEach((nt: any) => {
                   const k = nt?.nutrientKey || nt?.key;
                   if (k) recommendedKeysSet.add(k);
                 });
               }
             });`;

const newStr = `           } else if (agentType === 'health_baseline') {
             setIsMedicalChatOpen(false);
             const data = agentResult?.report || agentResult || {};
             const unselected = new Set(agentResult.unselectedRowKeys || []);
             const riskCategories = Array.isArray(data.riskCategories) ? data.riskCategories : [];
             const acceptedCategories = riskCategories.filter((_: any, idx: number) => !unselected.has(idx));
             
             const generalNutrientTargets = data.generalNutrientTargets || {};

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

             const recommendedKeysSet = new Set<string>();
             if (Array.isArray(data.topNutrientTargets)) {
               data.topNutrientTargets.forEach((nt: any) => {
                 const k = typeof nt === 'string' ? nt : (nt?.nutrientKey || nt?.key);
                 if (k) recommendedKeysSet.add(k);
               });
             }
             const rawWeeklyData = data.topWeeklyNutrientTargets || data.weeklyNutrientTargets;
             if (Array.isArray(rawWeeklyData)) {
               rawWeeklyData.forEach((nt: any) => {
                 const k = typeof nt === 'string' ? nt : (nt?.nutrientKey || nt?.key);
                 if (k) recommendedKeysSet.add(k);
               });
             } else if (typeof rawWeeklyData === 'object' && rawWeeklyData !== null) {
               Object.keys(rawWeeklyData).forEach(k => recommendedKeysSet.add(k));
             }
             acceptedCategories.forEach((cat: any) => {
               if (Array.isArray(cat.priorityNutrientTargets)) {
                 cat.priorityNutrientTargets.forEach((nt: any) => {
                   const k = nt?.nutrientKey || nt?.key;
                   if (k) recommendedKeysSet.add(k);
                 });
               }
             });`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/App.tsx', code);
