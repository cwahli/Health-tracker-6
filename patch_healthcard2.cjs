const fs = require('fs');
let code = fs.readFileSync('src/components/chat-cards/HealthBaselineCard.tsx', 'utf8');

const regex = /<div className="py-2 space-y-5">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\)/;

const replacement = `<div className="py-2 space-y-5">
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.analysisStr}</div>
                      <p className="text-sm text-theme-neutral leading-relaxed">
                        {category.targetTrajectory || category.description || category.analysis}
                      </p>
                    </div>

                    {(category.priorityNutrientTargets?.length > 0 || category.clinicalProtocols?.length > 0) && (
                      <div className="space-y-5">
                          {category.priorityNutrientTargets?.length > 0 && (
                          <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.nutrientTargets}</div>
                              <div className="grid gap-2">
                                {category.priorityNutrientTargets.map((nt: any, i: number) => (
                                  <div key={i} className="py-2 flex flex-col space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{nt.nutrientKey}</span>
                                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{nt.targetValue}</span>
                                    </div>
                                    {(nt.rationale || nt.reasoning) && <div className="text-xs text-slate-500 leading-relaxed">{nt.rationale || nt.reasoning}</div>}
                                  </div>
                                ))}
                              </div>
                          </div>
                          )}
                          {category.clinicalProtocols?.length > 0 && (
                          <div className="space-y-3">
                              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.dailyActivities}</div>
                              <ul className="space-y-2 list-disc list-inside text-sm text-theme-neutral">
                                {category.clinicalProtocols.map((da: string, i: number) => (
                                  <li key={i} className="py-1">
                                    {da}
                                  </li>
                                ))}
                              </ul>
                          </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/chat-cards/HealthBaselineCard.tsx', code);
