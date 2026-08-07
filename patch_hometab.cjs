const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

const regex = /<div className="mt-3 p-4 bg-theme-bg-card rounded-xl border border-theme-border\/50 space-y-3 normal-case font-normal text-xs">[\s\S]*?<\/div>\s*<\/details>/;

const replacement = `<div className="mt-3 p-4 bg-theme-bg-card rounded-xl border border-theme-border/50 space-y-3 normal-case font-normal text-xs">
                            <div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Analysis</span>
                              <p className="text-sm text-theme-neutral leading-relaxed">{baselineCat.targetTrajectory || baselineCat.analysis}</p>
                            </div>
                            {baselineCat.priorityNutrientTargets && baselineCat.priorityNutrientTargets.length > 0 && (
                              <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nutrient Targets</span>
                                <ul className="list-disc list-inside text-sm text-theme-neutral space-y-1">
                                  {baselineCat.priorityNutrientTargets.map((nt: any, idx: number) => (
                                    <li key={idx}><strong>{nt.nutrientKey}</strong>: {nt.targetValue} <span className="text-xs text-slate-500 block ml-4">{nt.rationale}</span></li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {baselineCat.clinicalProtocols && baselineCat.clinicalProtocols.length > 0 && (
                              <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Clinical Protocols</span>
                                <ul className="list-disc list-inside text-sm text-theme-neutral space-y-1">
                                  {baselineCat.clinicalProtocols.map((cp: string, idx: number) => (
                                    <li key={idx}>{cp}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </details>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/HomeTab.tsx', code);
