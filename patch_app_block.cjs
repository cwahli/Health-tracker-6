const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\} else if \(agentType === 'health_baseline'\) \{[\s\S]*?\} else if \(agentType === 'nutrition_general'\) \{/;

const replacement = `} else if (agentType === 'health_baseline') {
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
             });

             const topCoreKeys = Array.from(recommendedKeysSet).filter(isCoreNutrient);
             const topWeeklyKeys = Array.from(recommendedKeysSet).filter(isAdditionalNutrient);

             currentReport.topNutrientTargets = topCoreKeys;
             currentReport.topWeeklyNutrientTargets = topWeeklyKeys;

             if (currentReport.topNutrientTargets.length > 0) {
               updatedProfile.topNutrientsToMonitor = currentReport.topNutrientTargets;
             }
             currentReport.generalNutrientTargets = data.generalNutrientTargets;
             currentReport.nutrientRankingRationale = data.nutrientRankingRationale;
             currentReport.healthBaselineCategories = acceptedCategories;
             
             setReport(currentReport);
             setDailyBenefits(currentDailyBenefits);
          } else if (agentType === 'nutrition_general') {`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
