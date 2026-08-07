const fs = require('fs');
let code = fs.readFileSync('src/components/HealthPlanningResultView.tsx', 'utf8');

// For retest markers
const retestMarkupRegex = /\{item\.priorityReason && \([\s\S]*?\}\)/;
const newRetestMarkup = `{item.gpClinicalJustification && (
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                          <span className="font-bold">Clinical Justification:</span> {safeStr(item.gpClinicalJustification)}
                        </p>
                      )}
                      
                      {item.userBenefit ? (
                        <p className="text-[11px] text-theme-text-secondary leading-relaxed font-medium text-indigo-700 dark:text-indigo-400">
                          {safeStr(item.userBenefit)}
                        </p>
                      ) : (
                        item.reason && (
                          <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                            {safeStr(item.reason)}
                          </p>
                        )
                      )}
                      
                      {!item.gpClinicalJustification && item.priorityReason && (
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                          <span className="font-bold">Priority Rationale:</span> {safeStr(item.priorityReason)}
                        </p>
                      )}`;

code = code.replace(/\{item\.priorityReason && \([\s\S]*?\}\)\n\n                      \{item\.reason && \([\s\S]*?\}\)/, newRetestMarkup);

// For testing gaps
const gapMarkupRegex = /\{item\.priorityReason && \([\s\S]*?\}\)\n\n                        \{item\.reason && \([\s\S]*?\}\)/;
const newGapMarkup = `{item.gpClinicalJustification && (
                          <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                            <span className="font-bold">Clinical Justification:</span> {safeStr(item.gpClinicalJustification)}
                          </p>
                        )}

                        {item.userBenefit ? (
                          <p className="text-[11px] text-theme-text-secondary leading-relaxed font-medium text-indigo-700 dark:text-indigo-400">
                            {safeStr(item.userBenefit)}
                          </p>
                        ) : (
                          item.reason && (
                            <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                              {safeStr(item.reason)}
                            </p>
                          )
                        )}

                        {!item.gpClinicalJustification && item.priorityReason && (
                          <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                            <span className="font-bold">Priority Rationale:</span> {safeStr(item.priorityReason)}
                          </p>
                        )}`;

code = code.replace(/\{item\.priorityReason && \([\s\S]*?\}\)\n\n                        \{item\.reason && \([\s\S]*?\}\)/, newGapMarkup);

fs.writeFileSync('src/components/HealthPlanningResultView.tsx', code);
