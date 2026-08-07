const fs = require('fs');
let code = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf8');

// 1. Remove 'Pending Approval' from subCategories logic
code = code.replace(
  `return hasPendingApproval ? ['all', 'Pending Approval', ...arr] : ['all', ...arr];`,
  `return ['all', ...arr];`
);
code = code.replace(
  `return hasPendingApproval ? ['all', 'Pending Approval', ...arr] : ['all', ...arr];`, // second match
  `return ['all', ...arr];`
);
code = code.replace(
  `return hasPendingApproval ? ['all', 'Pending Approval', ...sortedPractices] : ['all', ...sortedPractices];`,
  `return ['all', ...sortedPractices];`
);

// 2. Insert pendingBiomarkersList and handleApproveBiomarker after hasEmptyBiomarkers useMemo
const target2 = `  // Important/highlighted biomarkers for user cardiovascular/kidney health`;
const replacement2 = `  const pendingBiomarkersList = useMemo(() => {
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
  };

  // Important/highlighted biomarkers for user cardiovascular/kidney health`;
code = code.replace(target2, replacement2);

// 3. Insert the new UI right before the accordion group
const target3 = `      {/* Accordions Group of Biomarkers */}
      <div className="space-y-2.5 mt-[20px]">`;
const replacement3 = `      {/* Dedicated Top-Level "Pending Approval" Category */}
      {pendingBiomarkersList.length > 0 && (
        <div className="mb-6 bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>⏳ Pending Approval</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                {pendingBiomarkersList.length} items
              </span>
            </h3>
            <span className="text-xs text-amber-400/80 font-mono animate-pulse">
              In process of being approved
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pendingBiomarkersList.map((item) => (
              <div key={item.key} className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{item.label}</div>
                  <div className="text-[10px] text-amber-400 font-mono">⏳ In process of being approved</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApproveBiomarker(item.key)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accordions Group of Biomarkers */}
      <div className="space-y-2.5 mt-[20px]">`;
code = code.replace(target3, replacement3);

// 4. Also remove the old accordion 'Pending Approval' special handling
code = code.replace(
  `                  {cat === 'Pending Approval' && (
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                        <span className="leading-snug">These biomarkers are pending approval in the biomarker dictionary. Once approved, they will move into their relevant medical groupings.</span>
                      </div>
                      {onLogMedical && (
                        <button
                          onClick={() => {
                            setDictionaryPreFillKey('');
                            setShowDictionaryModal(true);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer shrink-0 shadow-xs transition-colors"
                        >
                          Review & Approve
                        </button>
                      )}
                    </div>
                  )}`,
  ``
);

fs.writeFileSync('src/components/MedicalHistoryTab.tsx', code);
