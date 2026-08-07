const fs = require('fs');
let code = fs.readFileSync('src/components/ReviewBiomarkerModal.tsx', 'utf8');
code = code.replace(/function buildYamlContext([\s\S]*?)return lines\.join\("\\n"\);\n\}/, `function buildJsonContext(
  biomarkerKey: string,
  currentValue: number | string,
  allDefinitions: any[],
  biomarkerHistory: BiomarkerLog[],
  profile: UserProfile
): string {
  const def = allDefinitions.find(d => d.key === biomarkerKey) || {};
  
  // 1. Gathers demographic metadata
  const age = profile.age || 'unknown';
  const gender = profile.gender || 'unknown';
  const ethnicity = profile.ethnicity || 'unknown';
  const unitPreference = profile.unitPreference || 'SI';
  
  // 2. Selected biomarker details
  const targetMeta = getBiomarkerMetadata(biomarkerKey, profile.customBiomarkers?.[biomarkerKey]);
  const targetCategories = targetMeta.riskCategories || [];
  const targetConditions = targetMeta.potentialMedicalConditions || [];
  const targetGrouping = targetMeta.standardMedicalGrouping || '';
  
  // 3. Get full log history for the selected biomarker
  const sortedLogs = [...(biomarkerHistory || [])].sort((a, b) => b.date.localeCompare(a.date));
  const selectedHistory = sortedLogs
    .filter(log => log.biomarkers && log.biomarkers[biomarkerKey] !== undefined && log.biomarkers[biomarkerKey] !== '')
    .map(log => ({
      date: log.date,
      value: log.biomarkers[biomarkerKey],
      unit: def.unit || ''
    }));

  // 4. Find all related biomarkers grouped by tags
  const targetTags = new Set<string>();
  targetCategories.forEach((c: string) => targetTags.add(c.trim()));
  targetConditions.forEach((c: string) => targetTags.add(c.trim()));
  if (targetGrouping) targetTags.add(targetGrouping.trim());
  if (def.category && def.category.toLowerCase() !== 'other') targetTags.add(def.category.trim());
  
  const relatedBiomarkersByTag: Record<string, any[]> = {};
  
  targetTags.forEach(tag => {
    const tagMatches: any[] = [];
    allDefinitions.forEach(otherDef => {
      if (otherDef.key === biomarkerKey) return;
      
      const otherMeta = getBiomarkerMetadata(otherDef.key, profile.customBiomarkers?.[otherDef.key]);
      
      const otherTags = new Set<string>();
      (otherMeta.riskCategories || []).forEach((c: string) => otherTags.add(c.trim().toLowerCase()));
      (otherMeta.potentialMedicalConditions || []).forEach((c: string) => otherTags.add(c.trim().toLowerCase()));
      if (otherMeta.standardMedicalGrouping) otherTags.add(otherMeta.standardMedicalGrouping.trim().toLowerCase());
      if (otherDef.category && otherDef.category.toLowerCase() !== 'other') otherTags.add(otherDef.category.trim().toLowerCase());
      
      if (otherTags.has(tag.toLowerCase())) {
        let latestVal: number | string = 'N/A';
        let latestDate = 'N/A';
        for (const log of sortedLogs) {
          if (log.biomarkers && log.biomarkers[otherDef.key] !== undefined && log.biomarkers[otherDef.key] !== '') {
            latestVal = log.biomarkers[otherDef.key];
            latestDate = log.date;
            break;
          }
        }
        
        const customDetail = (profile.customBiomarkers?.[otherDef.key] || {}) as any;
        const medicalInsights = customDetail.specificRiskContext || otherDef.description || otherDef.descriptions?.en || '';
        
        tagMatches.push({
          key: otherDef.key,
          name: otherDef.name,
          latest_value: latestVal,
          unit: otherDef.unit || '',
          latest_date: latestDate,
          medical_insights: medicalInsights
        });
      }
    });
    
    if (tagMatches.length > 0) {
      relatedBiomarkersByTag[tag] = tagMatches;
    }
  });
  
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
      description: def.descriptions?.[profile.language] || def.descriptions?.en || '',
      medical_insights: ((profile.customBiomarkers?.[biomarkerKey] || {}) as any).specificRiskContext || ''
    },
    target_biomarker_history: selectedHistory,
    related_biomarkers_by_tag: relatedBiomarkersByTag
  };
  
  return JSON.stringify(payloadObj, null, 2);
}`);

code = code.replace(/buildYamlContext/g, 'buildJsonContext');
code = code.replace(/yamlContext/g, 'jsonContext');

fs.writeFileSync('src/components/ReviewBiomarkerModal.tsx', code);
