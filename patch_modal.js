const fs = require('fs');
let code = fs.readFileSync('src/components/BiomarkerDictionaryModal.tsx', 'utf8');

const target = `{/* TO BE APPROVED PANEL */}
              {toApproveKeys.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">`;

const replacement = `{/* Dynamic Bulk Action Bar for Pending Biomarkers */}
              {toApproveKeys.length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
                  <span className="text-xs font-semibold text-indigo-300">
                    {toApproveKeys.length} biomarker(s) pending approval:
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKeys(toApproveKeys);
                        setIsMedicalCategorisationMode(true);
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
                    >
                      Review categories ({toApproveKeys.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKeys(toApproveKeys);
                        if (onReviewWithAgent) {
                          onReviewWithAgent(toApproveKeys);
                        } else {
                           setTimeout(() => handleRunStandardizationAgent(), 0);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Standardize Units ({toApproveKeys.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKeys(toApproveKeys);
                        setIsAgentMode(true);
                        setTimeout(() => handleRunConsolidationAgent(true), 0);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Consolidate Names ({toApproveKeys.length})
                    </button>
                  </div>
                </div>
              )}

              {/* TO BE APPROVED PANEL */}
              {toApproveKeys.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/BiomarkerDictionaryModal.tsx', code);
