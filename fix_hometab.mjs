import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

const targetBlockStr = `                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {isOver ? (
                    <>
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: \`\${(weeklyTarget / actual7dRaw) * 100}%\` }}
                      />
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500" 
                        style={{ width: \`\${((actual7dRaw - weeklyTarget) / actual7dRaw) * 100}%\` }}
                      />
                    </>
                  ) : (
                    <div 
                      className={\`h-full rounded-full transition-all duration-500 \${isMet ? 'bg-emerald-500' : 'bg-indigo-600'}\`} 
                      style={{ width: \`\${weeklyTarget > 0 ? Math.min(100, pct) : 0}%\` }}
                    />
                  )}
                </div>`;

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

let occurence = 0;
code = code.replace(new RegExp(targetBlockStr.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\$&'), 'g'), (match) => {
  occurence++;
  if (occurence === 1) { // top target
    return topTargetReplacement;
  }
  return match; // weekly target remains same
});

// Also fix Expandable targets which I might have broken.
// Expandable targets use adjustedTarget and actualRaw. Let's find it.
const expTargetsRe = /<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\s*renderTarget/g;
// Actually I didn't break expandable targets, because it was only matching occurence=1 previously and I only ran global replace for the block that I already modified.

fs.writeFileSync('src/components/HomeTab.tsx', code);
