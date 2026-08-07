import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

// The block at 1169 (Weekly targets) needs to use actual7dRaw and weeklyTarget
code = code.replace(
  /<div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">\s*\{isOver \? \(\s*<>\s*<div\s*className="h-full bg-indigo-600 transition-all duration-500"\s*style=\{\{ width: `\$\{\(adjustedTarget \/ actual\) \* 100\}%` \}\}\s*\/>\s*<div\s*className="h-full bg-rose-500 transition-all duration-500"\s*style=\{\{ width: `\$\{\(\(actual - adjustedTarget\) \/ actual\) \* 100\}%` \}\}\s*\/>\s*<\/>\s*\) : \(\s*<div\s*className=\{\`h-full rounded-full transition-all duration-500 \$\{isMet \? 'bg-emerald-500' : 'bg-indigo-600'\}\`\}\s*style=\{\{ width: `\$\{adjustedTarget > 0 \? Math\.min\(100, \(actualRaw \/ adjustedTarget\) \* 100\) : 0\}%` \}\}\s*\/>\s*\)\}\s*\{showAverageInBar && \(\(\) => \{\s*const avg = getAverageIntake\(key, rollingDays\);\s*if \(avg === 0\) return null;\s*const targetToUse = isOver \? actualRaw : adjustedTarget;\s*const pct = Math\.min\(100, \(avg \/ targetToUse\) \* 100\);\s*return \(\s*<div\s*className="absolute top-0 bottom-0 w-\[3px\] bg-amber-400 z-10 shadow-sm"\s*style=\{\{ left: `\$\{pct\}%` \}\}\s*title=\{\`\$\{rollingDays\}-day average: \$\{formatValue\(avg\)\}\$\{unit\}\`\}\s*\/>\s*\);\s*\}\)\(\)\}\s*<\/div>/g,
  `<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
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
                </div>`
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
