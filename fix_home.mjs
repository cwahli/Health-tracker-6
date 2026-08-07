import fs from 'fs';
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf-8');

// fix actual7d and actual7dRaw and weeklyTarget that were wrongly replaced
code = code.replace(
  /className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">[\s\S]*?\{showAverageInBar && \(\(\) => \{[\s\S]*?\}\)\(\)\}\s*<\/div>/,
  `className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
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

// fix todayStr used before declaration
// find where todayStr is defined
// \`const todayStr = toYYYYMMDD(new Date());\` 
// Move getAverageIntake below todayStr, or pass todayStr to it.
code = code.replace(
  /const getAverageIntake = React\.useCallback\(\(key: string, numDays: number\) => \{[\s\S]*?\}, \[todayStr, activeFoodLogs\]\);/,
  ''
);

code = code.replace(
  /const todayStr = toYYYYMMDD\(new Date\(\)\);/,
  `const todayStr = toYYYYMMDD(new Date());

  const getAverageIntake = React.useCallback((key: string, numDays: number) => {
    let totalIntake = 0;
    for (let d = 0; d < numDays; d++) {
      const parts = todayStr.split('-');
      const todayDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const targetDate = new Date(todayDate);
      targetDate.setDate(todayDate.getDate() - d);
      
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = \`\${yyyy}-\${mm}-\${dd}\`;
      
      const dayFoods = activeFoodLogs.filter(f => f.date === targetDateStr);
      const dayTotal = dayFoods.reduce((acc, curr) => {
        return acc + (Number(curr.nutrients?.[key]) || 0);
      }, 0);
      totalIntake += dayTotal;
    }
    return numDays > 0 ? totalIntake / numDays : 0;
  }, [todayStr, activeFoodLogs]);`
);

// properly inject into the FIRST one (top target)
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

let count = 0;
code = code.replace(
  /<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\);/g,
  (match) => {
    count++;
    if (count === 1) { // Only replace the first occurrence
      return match.replace(/<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">[\s\S]*?<\/div>/, replacement);
    }
    return match;
  }
);

fs.writeFileSync('src/components/HomeTab.tsx', code);
