import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

const replacement = `
                <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {isOver ? (
                    <>
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: \`\${(adjustedTarget / actual) * 100}%\` }}
                      />
                      <div 
                        className="h-full bg-rose-500 transition-all duration-500" 
                        style={{ width: \`\${((actual - adjustedTarget) / actual) * 100}%\` }}
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

code = code.replace(
  /<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\);/g,
  (match) => {
    // Only replace the first occurrence that corresponds to the Top Targets map
    return match.replace(/<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">[\s\S]*?<\/div>/, replacement);
  }
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
