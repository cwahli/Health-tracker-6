const fs = require('fs');
let code = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf8');

const pendingMatch = `  const pendingBiomarkersList = useMemo(() => {
    return allDefinitions.filter(def => (def as any).needsApproval || profile.customBiomarkers?.[def.key]?.needsApproval).map(def => ({
      key: def.key,
      label: def.name || def.key
    }));
  }, [allDefinitions, profile.customBiomarkers]);

  const handleApproveBiomarker = (key: string) => {
    if (profile.customBiomarkers && profile.customBiomarkers[key]) {
      const newCustom = { ...profile.customBiomarkers };
      delete newCustom[key].needsApproval;
      onUpdateProfile({ customBiomarkers: newCustom });
    }
  };`;

code = code.replace(pendingMatch, '');

const insertTarget = `  }, [biomarkers, activeHistory, profile.customBiomarkers, profile.ethnicity, profile.gender, profile.height]);`;
const insertReplacement = insertTarget + '\n\n' + pendingMatch;

code = code.replace(insertTarget, insertReplacement);

fs.writeFileSync('src/components/MedicalHistoryTab.tsx', code);
