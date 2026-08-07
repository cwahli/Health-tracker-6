import fs from 'fs';
let code = fs.readFileSync('src/utils/biomarkers.ts', 'utf-8');

const newFn = `
export function buildReviewBiomarkerContext(
  biomarkerKey: string,
  currentValue: number | string,
  allDefinitions: any[],
  biomarkerHistory: any[],
  profile: any
): string {
  const customDef = profile?.customBiomarkers?.[biomarkerKey] || {};
  const def = getMergedBiomarkerDef(biomarkerKey, allDefinitions.find(d => d.key === biomarkerKey), customDef);

  const age = profile?.age || 'unknown';
  const gender = profile?.gender || 'unknown';
  const ethnicity = profile?.ethnicity || 'unknown';
  const unitPreference = profile?.unitPreference || 'SI';

  const targetMeta = getBiomarkerMetadata(biomarkerKey, customDef);
  
  const sortedLogs = [...(biomarkerHistory || [])].sort((a, b) => b.date.localeCompare(a.date));
  const selectedHistory = sortedLogs
    .filter(log => log.biomarkers && log.biomarkers[biomarkerKey] !== undefined && log.biomarkers[biomarkerKey] !== '')
    .map(log => ({
      date: log.date,
      value: log.biomarkers[biomarkerKey],
      unit: def.unit || ''
    }));

  const payloadObj = {
    user_profile: {
      age,
      gender,
      ethnicity,
      unit_preference: unitPreference
    },
    target_biomarker: {
      key: biomarkerKey,
      name: def.name || '',
      current_value: currentValue,
      unit: def.unit || '',
      normal_range: def.normalRange || '',
      description: def.description || def.descriptions?.[profile.language || 'en'] || def.descriptions?.en || '',
      medical_insights: customDef.specificRiskContext || customDef.benefitRisk || def.medicalInsight || '',
      optimal_value: customDef.optimalValue || def.optimalValue || '',
      severity_rating: getBiomarkerStatusLabel(biomarkerKey, getBiomarkerStatus(biomarkerKey, currentValue, def.normalRange, def.unit, profile), customDef, currentValue, profile),
      medical_categorisation: {
        risk_categories: targetMeta.riskCategories || [],
        potential_conditions: targetMeta.potentialMedicalConditions || [],
        standard_grouping: targetMeta.standardMedicalGrouping || ''
      }
    },
    target_biomarker_history: selectedHistory
  };

  return JSON.stringify(payloadObj, null, 2);
}
`;

code = code + newFn;
fs.writeFileSync('src/utils/biomarkers.ts', code);
