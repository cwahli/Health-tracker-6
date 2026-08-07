const fs = require('fs');
let code = fs.readFileSync('src/utils/syncUtils.ts', 'utf8');

const target = `export function mergeReports(cloudReport: RecommendationReport | null, localReport: RecommendationReport | null): RecommendationReport | null {
  if (!cloudReport && !localReport) return null;
  if (!cloudReport) return localReport;
  if (!localReport) return cloudReport;

  const mergedTargets = {
    ...(localReport.dailyNutrientTargets || {}),
    ...(cloudReport.dailyNutrientTargets || {})
  };

  const mergedActionsList = mergeActions(cloudReport.actions || [], localReport.actions || []);
  const mergedBenefitsList = mergeBenefits(cloudReport.dailyBenefits || [], localReport.dailyBenefits || []);

  return {
    ...localReport,
    ...cloudReport,
    dailyNutrientTargets: mergedTargets,
    actions: mergedActionsList,
    dailyBenefits: mergedBenefitsList,
    mostImportantNextStep: cloudReport.mostImportantNextStep || localReport.mostImportantNextStep || '',
    healthBaselineCategories: (cloudReport.healthBaselineCategories && cloudReport.healthBaselineCategories.length > 0)
      ? cloudReport.healthBaselineCategories
      : (localReport.healthBaselineCategories || [])
  };
}`;

const replacement = `export function mergeReports(cloudReport: RecommendationReport | null, localReport: RecommendationReport | null): RecommendationReport | null {
  if (!cloudReport && !localReport) return null;
  if (!cloudReport) return localReport;
  if (!localReport) return cloudReport;

  const cloudTime = cloudReport.timestamp ? new Date(cloudReport.timestamp).getTime() : 0;
  const localTime = localReport.timestamp ? new Date(localReport.timestamp).getTime() : 0;

  const primary = localTime >= cloudTime ? localReport : cloudReport;
  const secondary = localTime >= cloudTime ? cloudReport : localReport;

  const mergedTargets = {
    ...(secondary.dailyNutrientTargets || {}),
    ...(primary.dailyNutrientTargets || {})
  };

  const mergedActionsList = mergeActions(cloudReport.actions || [], localReport.actions || []);
  const mergedBenefitsList = mergeBenefits(cloudReport.dailyBenefits || [], localReport.dailyBenefits || []);

  return {
    ...secondary,
    ...primary,
    dailyNutrientTargets: mergedTargets,
    actions: mergedActionsList,
    dailyBenefits: mergedBenefitsList,
    mostImportantNextStep: primary.mostImportantNextStep || secondary.mostImportantNextStep || '',
    healthBaselineCategories: (primary.healthBaselineCategories && primary.healthBaselineCategories.length > 0)
      ? primary.healthBaselineCategories
      : (secondary.healthBaselineCategories || [])
  };
}`;

if (code.includes('const mergedTargets = {') && !code.includes('const primary = localTime >= cloudTime ? localReport : cloudReport;')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/utils/syncUtils.ts', code);
  console.log("Successfully patched syncUtils.ts");
} else {
  console.log("Could not find the target string in syncUtils.ts");
}
