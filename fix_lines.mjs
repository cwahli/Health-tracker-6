import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');
const lines = code.split('\n');

const topTargetReplacement = `                <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {isOver ? (
                    <>
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: \`\${(adjustedTarget / actualRaw) * 100}%\` }}
                      />
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500" 
                        style={{ width: \`\${((actualRaw - adjustedTarget) / actualRaw) * 100}%\` }}
                      />
                    </>
                  ) : (
                    <div 
                      className={\`h-full rounded-full transition-all duration-500 \${isMet ? 'bg-emerald-500' : 'bg-indigo-600'}\`} 
                      style={{ width: \`\${adjustedTarget > 0 ? Math.min(100, (actualRaw / adjustedTarget) * 100) : 0}%\` }}
                    />
                  )}
                  {showAverageInBar && (() => {
                     const avg = getAverageIntake(key, rollingDays);
                     if (avg === 0) return null;
                     const targetToUse = isOver ? actualRaw : adjustedTarget;
                     const pct = Math.min(100, (avg / targetToUse) * 100);
                     return (
                       <div 
                         className="absolute top-0 bottom-0 w-[3px] bg-amber-400 z-10 shadow-sm"
                         style={{ left: \`\${pct}%\` }}
                         title={\`\${rollingDays}-day average: \${formatValue(avg)}\${unit}\`}
                       />
                     );
                  })()}
                </div>`;

// Replace lines 1052 to 1071
lines.splice(1052, 19, topTargetReplacement);
fs.writeFileSync('src/components/HomeTab.tsx', lines.join('\n'));

// Now fix MedicalHistoryTab.tsx
let mcode = fs.readFileSync('src/components/MedicalHistoryTab.tsx', 'utf-8');
mcode = mcode.replace(/onOpenAiReview=\{undefined\}\n/g, ''); // in case I replaced it with undefined earlier
mcode = mcode.replace(/onCombineBiomarker=\{undefined\}\n/g, '');
mcode = mcode.replace(/\{reviewingBiomarkerKey && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>/g, '</div>\n</div>');
fs.writeFileSync('src/components/MedicalHistoryTab.tsx', mcode);

